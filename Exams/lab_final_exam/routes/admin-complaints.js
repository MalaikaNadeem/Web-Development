const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/user');
const Order = require('../models/order');

const requireAdmin = (req, res, next) => {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/login');
  }
  
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Access denied. Admin privileges required.');
    return res.redirect('/');
  }
  
  next();
};

router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'all';
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const dateRange = req.query.dateRange || 'all';

    
    let query = {};
    
    if (status !== 'all') {
      query.status = status;
    }

    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case '3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
      }
      
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    const totalComplaints = await Complaint.countDocuments(query);
    
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    let complaints = await Complaint.find(query)
      .populate('userId', 'name email phone createdAt')
      .populate('orderId', 'orderNumber total createdAt status')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    let filteredComplaints = complaints;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredComplaints = complaints.filter(complaint => {
        const userName = complaint.userId?.name?.toLowerCase() || '';
        const userEmail = complaint.userId?.email?.toLowerCase() || '';
        const message = complaint.message?.toLowerCase() || '';
        const orderNumber = complaint.orderId?.orderNumber?.toLowerCase() || '';
        const manualOrderId = complaint.manualOrderIdentifier?.toLowerCase() || '';
        
        return userName.includes(searchLower) ||
               userEmail.includes(searchLower) ||
               message.includes(searchLower) ||
               orderNumber.includes(searchLower) ||
               manualOrderId.includes(searchLower);
      });
    }

    const totalPages = Math.ceil(totalComplaints / limit);

    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const additionalStats = await Complaint.aggregate([
      {
        $facet: {
          statusStats: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          monthlyStats: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 6 }
          ],
          avgResponseTime: [
            {
              $match: {
                status: 'resolved',
                updatedAt: { $exists: true }
              }
            },
            {
              $group: {
                _id: null,
                avgTime: {
                  $avg: {
                    $subtract: ['$updatedAt', '$createdAt']
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    const complaintStats = {
      total: totalComplaints,
      pending: 0,
      'in-progress': 0,
      resolved: 0
    };

    stats.forEach(stat => {
      if (stat._id && complaintStats.hasOwnProperty(stat._id)) {
        complaintStats[stat._id] = stat.count;
      }
    });

    const avgResponseTime = additionalStats[0].avgResponseTime[0]?.avgTime
      ? Math.round(additionalStats[0].avgResponseTime[0].avgTime / (1000 * 60 * 60 * 24))
      : 0;

    res.render('admin/complaints', {
      title: 'Manage Complaints',
      layout: 'layouts/admin',
      user: req.session.user,
      complaints: filteredComplaints,
      stats: complaintStats,
      avgResponseTime,
      monthlyStats: additionalStats[0].monthlyStats,
      currentPage: page,
      totalPages: totalPages,
      currentStatus: status,
      searchQuery: search,
      sortBy,
      sortOrder,
      dateRange,
      limit,
      totalComplaints,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      success: req.flash('success'),
      error: req.flash('error')
    });

  } catch (error) {
    console.error('Error loading complaints:', error);
    req.flash('error', 'Error loading complaints. Please try again.');
    res.redirect('/admin');
  }
});


router.post('/bulk-update', requireAdmin, async (req, res) => {
  try {
    const { complaintIds, action, status, adminResponse } = req.body;
    
    if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
      req.flash('error', 'No complaints selected');
      return res.redirect('/admin/complaints');
    }

    const validIds = complaintIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/));
    if (validIds.length === 0) {
      req.flash('error', 'Invalid complaint IDs');
      return res.redirect('/admin/complaints');
    }

    let updateResult;
    
    if (action === 'updateStatus') {
      const validStatuses = ['pending', 'in-progress', 'resolved'];
      if (!validStatuses.includes(status)) {
        req.flash('error', 'Invalid status');
        return res.redirect('/admin/complaints');
      }

      const updateData = { 
        status, 
        updatedAt: new Date() 
      };
      
      if (adminResponse && adminResponse.trim()) {
        updateData.adminResponse = adminResponse.trim();
      }

      updateResult = await Complaint.updateMany(
        { _id: { $in: validIds } },
        updateData
      );
    } else if (action === 'delete') {
      updateResult = await Complaint.deleteMany(
        { _id: { $in: validIds } }
      );
      req.flash('success', `${updateResult.deletedCount} complaints deleted successfully`);
      return res.redirect('/admin/complaints');
    }

    req.flash('success', `${updateResult.modifiedCount} complaints updated successfully`);
    res.redirect('/admin/complaints');

  } catch (error) {
    console.error('Error in bulk update:', error);
    req.flash('error', 'Error updating complaints. Please try again.');
    res.redirect('/admin/complaints');
  }
});

router.post('/update-status/:id', requireAdmin, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const complaintId = req.params.id;

    if (!complaintId.match(/^[0-9a-fA-F]{24}$/)) {
      req.flash('error', 'Invalid complaint ID');
      return res.redirect('/admin/complaints');
    }

    const validStatuses = ['pending', 'in-progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      req.flash('error', 'Invalid status');
      return res.redirect('/admin/complaints');
    }

    const updateData = { status, updatedAt: new Date() };
    if (adminResponse && adminResponse.trim()) {
      updateData.adminResponse = adminResponse.trim();
    }

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      updateData,
      { new: true }
    ).populate('userId', 'name email');

    if (!complaint) {
      req.flash('error', 'Complaint not found');
      return res.redirect('/admin/complaints');
    }

    req.flash('success', `Complaint from ${complaint.userId.name} updated successfully`);
    res.redirect('/admin/complaints');

  } catch (error) {
    console.error('Error updating complaint:', error);
    req.flash('error', 'Error updating complaint. Please try again.');
    res.redirect('/admin/complaints');
  }
});

router.get('/view/:id', requireAdmin, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      req.flash('error', 'Invalid complaint ID');
      return res.redirect('/admin/complaints');
    }

    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email phone createdAt')
      .populate('orderId', 'orderNumber total items createdAt status deliveryAddress');

    if (!complaint) {
      req.flash('error', 'Complaint not found');
      return res.redirect('/admin/complaints');
    }

    const relatedComplaints = await Complaint.find({
      userId: complaint.userId._id,
      _id: { $ne: complaint._id }
    })
    .populate('orderId', 'orderNumber total')
    .sort({ createdAt: -1 })
    .limit(5);

    res.render('admin/complaint-detail', {
      title: `Complaint Details - ${complaint.userId.name}`,
      layout: 'layouts/admin',
      user: req.session.user,
      complaint: complaint,
      relatedComplaints: relatedComplaints,
      success: req.flash('success'),
      error: req.flash('error')
    });

  } catch (error) {
    console.error('Error loading complaint details:', error);
    req.flash('error', 'Error loading complaint details');
    res.redirect('/admin/complaints');
  }
});

router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { status, dateRange } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
      
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber total')
      .sort({ createdAt: -1 });

    // Generate CSV content
    const csvHeader = 'Date,Customer Name,Customer Email,Order Number,Message,Status,Admin Response\n';
    const csvRows = complaints.map(complaint => {
      const date = new Date(complaint.createdAt).toLocaleDateString();
      const customerName = complaint.userId?.name || 'N/A';
      const customerEmail = complaint.userId?.email || 'N/A';
      const orderNumber = complaint.orderId?.orderNumber || complaint.manualOrderIdentifier || 'N/A';
      const message = `"${complaint.message.replace(/"/g, '""')}"`;
      const status = complaint.status;
      const adminResponse = complaint.adminResponse 
        ? `"${complaint.adminResponse.replace(/"/g, '""')}"` 
        : 'N/A';
      
      return `${date},${customerName},${customerEmail},${orderNumber},${message},${status},${adminResponse}`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=complaints-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting complaints:', error);
    req.flash('error', 'Error exporting complaints');
    res.redirect('/admin/complaints');
  }
});

// DELETE - Delete complaint
router.delete('/delete/:id', requireAdmin, async (req, res) => {
  try {
    // Validate ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint ID' });
    }

    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, message: 'Complaint deleted successfully' });

  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ success: false, message: 'Error deleting complaint' });
  }
});

// GET - Get complaint statistics (API endpoint for dashboard widgets)
router.get('/api/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $facet: {
          statusStats: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          dailyStats: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt'
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id': 1 } }
          ],
          avgResponseTime: [
            {
              $match: {
                status: 'resolved',
                updatedAt: { $exists: true }
              }
            },
            {
              $group: {
                _id: null,
                avgTime: {
                  $avg: {
                    $subtract: ['$updatedAt', '$createdAt']
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching complaint stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
});

module.exports = router;