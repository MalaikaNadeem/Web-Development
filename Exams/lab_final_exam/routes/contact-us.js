const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Order = require('../models/order'); 
const User = require('../models/user'); 
const mongoose = require('mongoose');


const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  next();
};

router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('User ID from session:', req.session.userId); 
    
    let userOrders = [];
    
    userOrders = await Order.find({ 
      userId: req.session.userId
    })
    .select('_id totalAmount orderDate orderNumber')
    .sort({ orderDate: -1 });
    
    console.log('Orders found by userId:', userOrders.length);
    
    if (userOrders.length === 0 && req.session.user && req.session.user.email) {
      userOrders = await Order.find({ 
        customerEmail: req.session.user.email.toLowerCase() 
      })
      .select('_id totalAmount orderDate orderNumber')
      .sort({ orderDate: -1 });
      
      console.log('Orders found by email:', userOrders.length); 
      
      if (userOrders.length > 0) {
        console.log('Updating orders with userId for future queries...');
        await Order.updateMany(
          { customerEmail: req.session.user.email.toLowerCase(), userId: { $in: [null, undefined] } },
          { $set: { userId: req.session.userId } }
        );
        console.log('Orders updated with userId');
      }
    }

    const userComplaints = await Complaint.find({ userId: req.session.userId })
      .populate({
        path: 'orderId',
        select: 'totalAmount orderDate orderNumber',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 });

    console.log('Final results - Orders:', userOrders.length, 'Complaints:', userComplaints.length); // Debug log

    res.render('contact-us', {
      title: 'Contact Us',
      user: req.session.user,
      orders: userOrders,
      complaints: userComplaints,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Error loading contact page:', error);
    req.flash('error', 'Error loading page. Please try again.');
    res.redirect('/');
  }
});

async function findOrderByIdOrNumber(identifier, userId = null, userEmail = null) {
  let order = null;
  
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    order = await Order.findById(identifier);
    if (order) {
      console.log('Order found by ObjectId:', identifier);
      return order;
    }
  }

  order = await Order.findOne({ orderNumber: identifier.toUpperCase() });
  if (order) {
    console.log('Order found by orderNumber:', identifier);
    return order;
  }
  
  const cleanedIdentifier = identifier.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  order = await Order.findOne({ 
    $or: [
      { orderNumber: cleanedIdentifier },
      { orderNumber: new RegExp(cleanedIdentifier, 'i') }
    ]
  });
  
  if (order) {
    console.log('Order found by cleaned orderNumber:', cleanedIdentifier);
    return order;
  }
  
  order = await Order.findOne({ 
    orderNumber: { $regex: identifier, $options: 'i' }
  });
  
  if (order) {
    console.log('Order found by partial orderNumber match:', identifier);
    return order;
  }
  
  console.log('Order not found for identifier:', identifier);
  return null;
}

router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { orderId, manualOrderId, message, orderInputMethod } = req.body;
    const userId = req.session.userId;

    console.log('Submitting complaint for user:', userId, 'method:', orderInputMethod); // Debug log
    if (!message || message.trim().length === 0) {
      req.flash('error', 'Please provide a message');
      return res.redirect('/contact-us');
    }

    if (message.trim().length < 10) {
      req.flash('error', 'Message should be at least 10 characters long');
      return res.redirect('/contact-us');
    }

    if (message.trim().length > 1000) {
      req.flash('error', 'Message should not exceed 1000 characters');
      return res.redirect('/contact-us');
    }

    let finalOrderId = null;
    let order = null;

    if (orderInputMethod === 'select' && orderId) {
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        req.flash('error', 'Invalid Order ID format');
        return res.redirect('/contact-us');
      }

      order = await Order.findById(orderId);
      if (!order) {
        req.flash('error', 'Selected order not found');
        return res.redirect('/contact-us');
      }
      
      finalOrderId = orderId;
      
    } else if (orderInputMethod === 'manual' && manualOrderId) {
      const cleanManualOrderId = manualOrderId.trim();
      
      if (cleanManualOrderId.length < 3) {
        req.flash('error', 'Order ID should be at least 3 characters long');
        return res.redirect('/contact-us');
      }

      order = await findOrderByIdOrNumber(cleanManualOrderId, userId, req.session.user?.email);
      
      if (!order) {
        req.flash('error', 'Order not found. Please check your Order ID or Order Number and try again.');
        return res.redirect('/contact-us');
      }
      
      finalOrderId = order._id;
      
    } else if (orderInputMethod !== 'general') {
      req.flash('error', 'Please select a valid complaint type');
      return res.redirect('/contact-us');
    }

    if (finalOrderId) {
      const existingComplaint = await Complaint.findOne({ 
        orderId: finalOrderId, 
        userId: userId 
      });
      
      if (existingComplaint) {
        req.flash('error', 'You have already filed a complaint for this order');
        return res.redirect('/contact-us');
      }
    }

    const complaint = new Complaint({
      userId: userId,
      orderId: finalOrderId,
      message: message.trim(),

      ...(orderInputMethod === 'manual' && manualOrderId && {
        manualOrderIdentifier: manualOrderId.trim()
      })
    });

    await complaint.save();
    
    let successMessage = 'Your complaint has been submitted successfully. We will review it shortly.';
    if (order) {
      successMessage += ` (Order: ${order.orderNumber || order._id.toString().slice(-6)})`;
    }
    
    req.flash('success', successMessage);
    res.redirect('/contact-us');

  } catch (error) {
    console.error('Error submitting complaint:', error);
    req.flash('error', 'Error submitting complaint. Please try again.');
    res.redirect('/contact-us');
  }
});

router.get('/complaint/:id', requireAuth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      req.flash('error', 'Invalid complaint ID');
      return res.redirect('/contact-us');
    }

    const complaint = await Complaint.findOne({ 
      _id: req.params.id, 
      userId: req.session.userId 
    }).populate('orderId', 'orderNumber totalAmount orderDate');

    if (!complaint) {
      req.flash('error', 'Complaint not found');
      return res.redirect('/contact-us');
    }

    res.render('complaint-detail', {
      title: 'Complaint Details',
      user: req.session.user,
      complaint: complaint,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (error) {
    console.error('Error loading complaint details:', error);
    req.flash('error', 'Error loading complaint details');
    res.redirect('/contact-us');
  }
});

module.exports = router;