const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const mongoose = require('mongoose');

const Product = require('./models/product');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/Missguided2', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  seedProducts();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

app.locals.users = [];

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
  secret: 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

app.use((req, res, next) => {
  res.locals.cartCount = req.session.cart ? 
    req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;
  
  res.locals.user = req.session.userId ? 
    { id: req.session.userId, name: req.session.username } : null;
  
  next();
});

async function getProduct(productId) {
  try {
    const product = await Product.findById(productId);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

async function getAllProducts() {
  try {
    const products = await Product.find({});
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function seedProducts() {
  try {
      const sampleProducts = [
      {
        seedId: 'product1',
        name: 'Knitted Stripe Sleeveless Bodycon Mini Dress',
        price: '5.59',
        quantity: '100',
        description: 'Trendy knitted bodycon dress with a striped sleeveless design.',
        image: 'Images/missguiededimg16pt1.webp',
        hoverImage: 'Images/missguidedimg16pt2.webp',
        category: 'dresses'
      },
      {
        seedId: 'p002',
        name: 'Sheer Shirring Halter Neck Top And Maxi Skirt Two Piece Co Ord Set',
        price: '27.99',
        quantity: '80',
        description: 'Elegant sheer halter neck top paired with a maxi skirt for a complete co-ord look.',
        image: 'Images/missguidedimg17.webp',
        hoverImage: 'Images/missguidedimg17pt2.webp',
        category: 'co-ords'
      },
      {
        seedId: 'p003',
        name: 'Fluffy Knit Button Through Cardigan',
        price: '11.24',
        quantity: '150',
        description: 'Soft and cozy fluffy knit cardigan with button-through design.',
        image: 'Images/missguidedimg18pt1.webp',
        hoverImage: 'Images/missguidedimg18pt2.webp',
        category: 'knitwear'
      },
      {
        seedId: 'p004',
        name: 'Tailored Sleeveless Top And Wide Leg Two Piece Co-Ord Set',
        price: '18.39',
        quantity: '90',
        description: 'Stylish tailored two-piece set with a sleeveless top and wide-leg pants.',
        image: 'Images/missguidedimg19pt1.webp',
        hoverImage: 'Images/missguidedimg19pt2.webp',
        category: 'co-ords'
      },
      {
        seedId: 'p005',
        name: 'Missguided x Playboy All Over Bunny Print Henley Top And Shorts Two Piece Pajama Co Ord Set',
        price: '18.39',
        quantity: '70',
        description: 'Playboy pajama set featuring bunny print Henley top and shorts.',
        image: 'Images/missguidedimg20pt1.webp',
        hoverImage: 'Images/missguidedimg20pt2.webp',
        category: 'pajamas'
      },
      {
        seedId: 'p006',
        name: 'Asymmetric One Shoulder Drape Mini Dress',
        price: '10.39',
        quantity: '100',
        description: 'Chic asymmetric mini dress with shoulder drape detailing.',
        image: 'Images/missguidedimg21pt1.webp',
        hoverImage: 'Images/missguidedimg21pt2.webp',
        category: 'dresses'
      },
      {
        seedId: 'p007',
        name: 'Missguided x Playboy Small Bunny Vest And Fitted Shorts Two Piece Pajama Co Ord Set',
        price: '15.99',
        quantity: '90',
        description: 'Playboy-themed vest and shorts pajama co-ord set with small bunny print.',
        image: 'Images/missguidedimg22pt1.webp',
        hoverImage: 'Images/missguidedimg22pt2.webp',
        category: 'pajamas'
      },
      {
        seedId: 'p008',
        name: 'Bead Detail Bardot Babydoll Mini Dress',
        price: '11.99',
        quantity: '110',
        description: 'Mini dress with bead detailing and off-shoulder Bardot style.',
        image: 'Images/missguidedimg23pt1.webp',
        hoverImage: 'Images/missguidedimg23pt2.webp',
        category: 'dresses'
      },
      {
        seedId: 'p009',
        name: 'Crochet Ombre Print Fitted Hot Pants',
        price: '3.99',
        quantity: '200',
        description: 'Fitted hot pants with a vibrant ombre crochet print.',
        image: 'Images/missguidedimg24pt1.webp',
        hoverImage: 'Images/missguidedimg24pt2.webp',
        category: 'bottoms'
      },
      {
        seedId: 'p010',
        name: 'Stripe Crochet Knit Long Sleeves Open Back Bodycon Mini Dress',
        price: '9.99',
        quantity: '75',
        description: 'Bodycon mini dress with open back and long stripe crochet sleeves.',
        image: 'Images/missguidedimg25pt1.webp',
        hoverImage: 'Images/missguidedimg25pt2.webp',
        category: 'knitwear'
      },
      {
        seedId: 'p011',
        name: 'Metal Trim Detail Cut Out Side Slit Knitted Maxi Dress',
        price: '13.49',
        quantity: '60',
        description: 'Knitted maxi dress with metal trim details and side slit cutouts.',
        image: 'Images/missguidedimg26pt1.webp',
        hoverImage: 'Images/missguidedimg26pt2.webp',
        category: 'maxi'
      },
      {
        seedId: 'p012',
        name: 'Pleated Halter Neck Skater Mini Dress',
        price: '11.24',
        quantity: '130',
        description: 'Mini skater dress with a halter neck and pleated design.',
        image: 'Images/missguidedimg27pt1.webp',
        hoverImage: 'Images/missguidedimg27pt2.webp',
        category: 'dresses'
      },
      {
        seedId: 'p013',
        name: 'One Shoulder O Ring Detail Cut Out Maxi Beach Dress',
        price: '19.99',
        quantity: '85',
        description: 'Beach-ready one shoulder maxi dress with O-ring and cut-out detailing.',
        image: 'Images/missguidedimg28pt1.webp',
        hoverImage: 'Images/missguidedimg28pt2.webp',
        category: 'maxi'
      },
      {
        seedId: 'p014',
        name: 'Asymmetric One Shoulder Cut Out Waist Side Tie Bodycon Mini Dress',
        price: '8.79',
        quantity: '140',
        description: 'Bodycon mini dress with side tie and waist cut-out, designed with asymmetric shoulder.',
        image: 'Images/missguidedimg29pt1.webp',
        hoverImage: 'Images/missguidedimg29pt2.webp',
        category: 'dresses'
      },
      {
        seedId: 'p015',
        name: 'Sequin Knit Sleeveless Bodycon Mini Dress',
        price: '13.59',
        quantity: '95',
        description: 'Sleeveless sequin knit bodycon mini dress for a dazzling look.',
        image: 'Images/missguidedimg30pt1.webp',
        hoverImage: 'Images/missguidedimg30pt2.webp',
        category: 'partywear'
      }
    ];

    console.log('Updating/Seeding products...');
    
  
    for (const productData of sampleProducts) {
      const { seedId, ...productFields } = productData;
      
      await Product.findOneAndUpdate(
        { seedId: seedId }, 
        { 
          ...productFields,
          seedId: seedId,
          updatedAt: new Date()
        },
        { 
          upsert: true, 
          new: true,    
          setDefaultsOnInsert: true
        }
      );
      
      console.log(`✓ Updated/Created product: ${productFields.name}`);
    }

    console.log('All sample products have been updated/seeded successfully');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}


app.get('/admin/refresh-products', async (req, res) => {
  try {
    await seedProducts();
    res.json({ success: true, message: 'Products refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing products:', error);
    res.status(500).json({ success: false, message: 'Error refreshing products' });
  }
});

app.get('/', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.render('index', { 
      title: 'Home - Missguided',
      products: products,
      message: req.session.message,
      error: req.session.error
    });
    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('index', { 
      title: 'Home - Missguided',
      products: [],
      error: 'Error loading products'
    });
  }
});

app.get('/product/:id', async (req, res) => {
  try {
    let product;
    

    if (req.params.id.startsWith('p')) {
      product = await Product.findOne({ seedId: req.params.id });
    }
    
    if (!product) {
      product = await Product.findById(req.params.id);
    }
    
    if (!product) {
      return res.status(404).render('404', { title: 'Product Not Found - Missguided' });
    }
    res.render('product-detail', {
      title: `${product.name} - Missguided`,
      product: product
    });
  } catch (error) {
    console.error('Error loading product:', error);
    res.status(500).render('500', { title: 'Server Error - Missguided' });
  }
});

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const checkoutRoutes = require('./routes/checkout');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/cart', cartRoutes.router);
app.use('/orders', orderRoutes);
app.use('/products', productRoutes);


app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found - Missguided',
    message: 'The page you are looking for does not exist.'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { 
    title: 'Server Error -Missguided',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;