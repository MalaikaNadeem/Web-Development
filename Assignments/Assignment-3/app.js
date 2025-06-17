const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let users = []; 
const products = [
  {
    id: 1,
    name: "Knitted Stripe Sleeveless Bodycon Mini Dress",
    price: 5.59,
    originalPrice: 7.04,
    discount: "25% OFF",
    image: "/Images/missguiededimg16pt1.webp",
    hoverImage: "/Images/missguidedimg16pt2.webp",
    category: "dresses"
  },
  {
    id: 2,
    name: "Sheer Shirring Halter Neck Top And Maxi Skirt Two Piece Co Ord Set",
    price: 27.99,
    originalPrice: 35.27,
    discount: "25% OFF",
    image: "/Images/missguidedimg17.webp",
    hoverImage: "/Images/missguidedimg17pt2.webp",
    category: "coords"
  },
  {
    id: 3,
    name: "Fluffy Knit Button Through Cardigan",
    price: 11.24,
    originalPrice: 14.99,
    discount: "25% OFF",
    image: "/Images/missguidedimg18pt1.webp",
    hoverImage: "/Images/missguidedimg18pt2.webp",
    category: "knitwear"
  },
  {
    id: 4,
    name: "Tailored Sleeveless Top And Wide Leg Two Piece Co-Ord Set",
    price: 18.39,
    originalPrice: 23.17,
    discount: "25% OFF",
    image: "/Images/missguidedimg19pt1.webp",
    hoverImage: "/Images/missguidedimg19pt2.webp",
    category: "coords"
  },
  {
    id: 5,
    name: "Missguided x Playboy All Over Bunny Print Henley Top And Shorts Two Piece Pajama Co Ord Set",
    price: 18.39,
    originalPrice: 23.17,
    discount: "25% OFF",
    image: "/Images/missguidedimg20pt1.webp",
    hoverImage: "/Images/missguidedimg20pt2.webp",
    category: "loungewear"
  },
  {
    id: 6,
    name: "Asymmetric One Shoulder Drape Mini Dress",
    price: 10.39,
    originalPrice: 13.09,
    discount: "25% OFF",
    image: "/Images/missguidedimg21pt1.webp",
    hoverImage: "/Images/missguidedimg21pt2.webp",
    category: "dresses"
  },
  {
    id: 7,
    name: "Missguided x Playboy Small Bunny Vest And Fitted Shorts Two Piece Pajama Co Ord Set",
    price: 15.99,
    originalPrice: 20.15,
    discount: "25% OFF",
    image: "/Images/missguidedimg22pt1.webp",
    hoverImage: "/Images/missguidedimg22pt2.webp",
    category: "loungewear"
  },
  {
    id: 8,
    name: "Bead Detail Bardot Babydoll Mini Dress",
    price: 11.99,
    originalPrice: 15.11,
    discount: "25% OFF",
    image: "/Images/missguidedimg23pt1.webp",
    hoverImage: "/Images/missguidedimg23pt2.webp",
    category: "dresses"
  },
  {
    id: 9,
    name: "Crochet Ombre Print Fitted Hot Pants",
    price: 3.99,
    originalPrice: 5.03,
    discount: "25% OFF",
    image: "/Images/missguidedimg24pt1.webp",
    hoverImage: "/Images/missguidedimg24pt2.webp",
    category: "shorts"
  },
  {
    id: 10,
    name: "Stripe Crochet Knit Long Sleeves Open Back Bodycon Mini Dress",
    price: 9.99,
    originalPrice: 23.09,
    discount: "25% OFF",
    image: "/Images/missguidedimg25pt1.webp",
    hoverImage: "/Images/missguidedimg25pt2.webp",
    category: "dresses"
  },
  {
    id: 11,
    name: "Metal Trim Detail Cut Out Side Slit Knitted Maxi Dress",
    price: 13.49,
    originalPrice: 17.99,
    discount: "25% OFF",
    image: "/Images/missguidedimg26pt1.webp",
    hoverImage: "/Images/missguidedimg26pt2.webp",
    category: "dresses"
  },
  {
    id: 12,
    name: "Pleated Halter Neck Skater Mini Dress",
    price: 11.24,
    originalPrice: 14.99,
    discount: "25% OFF",
    image: "/Images/missguidedimg27pt1.webp",
    hoverImage: "/Images/missguidedimg27pt2.webp",
    category: "dresses"
  },
  {
    id: 13,
    name: "One Shoulder O Ring Detail Cut Out Maxi Beach Dress",
    price: 19.99,
    originalPrice: 25.19,
    discount: "25% OFF",
    image: "/Images/missguidedimg28pt1.webp",
    hoverImage: "/Images/missguidedimg28pt2.webp",
    category: "dresses"
  },
  {
    id: 14,
    name: "Asymmetric One Shoulder Cut Out Waist Side Tie Bodycon Mini Dress",
    price: 8.79,
    originalPrice: 11.08,
    discount: "25% OFF",
    image: "/Images/missguidedimg29pt1.webp",
    hoverImage: "/Images/missguidedimg29pt2.webp",
    category: "dresses"
  },
  {
    id: 15,
    name: "Sequin Knit Sleeveless Bodycon Mini Dress",
    price: 13.59,
    originalPrice: 17.12,
    discount: "25% OFF",
    image: "/Images/missguidedimg30pt1.webp",
    hoverImage: "/Images/missguidedimg30pt2.webp",
    category: "dresses"
  },
  {
    id: 16,
    name: "Satin Cowl Neck Spaghetti Strap Drape Mini Dress",
    price: 11.33,
    originalPrice: 15.11,
    discount: "25% OFF",
    image: "/Images/missguidedimg31pt1.webp",
    hoverImage: "/Images/missguidedimg31pt2.webp",
    category: "dresses"
  },
  {
    id: 17,
    name: "Missguided x Playboy All Over Bunny Long Sleeved Shirt And Wide Leg Pants Two Piece Pajama Co Ord Set",
    price: 37.49,
    originalPrice: 49.99,
    discount: "25% OFF",
    image: "/Images/missguidedimg32pt1.webp",
    hoverImage: "/Images/missguidedimg32pt2.webp",
    category: "loungewear"
  },
  {
    id: 18,
    name: "Slinky Deep Plunge Cowl Neck Bodycon Mini Dress",
    price: 9.59,
    originalPrice: 12.08,
    discount: "25% OFF",
    image: "/Images/missguidedimg33pt2.webp",
    hoverImage: "/Images/missguidedimg33pt1.webp",
    category: "dresses"
  },
  {
    id: 19,
    name: "Sheer KniCowl Neck Strappy Midi Dress",
    price: 8.24,
    originalPrice: 10.99,
    discount: "25% OFF",
    image: "/Images/missguidedimg34pt1.webp",
    hoverImage: "/Images/missguidedimg34pt2.webp",
    category: "dresses"
  },
  {
    id: 20,
    name: "Graphic Printed Drop Shoulder Oversized T-Shirt",
    price: 12.74,
    originalPrice: 16.99,
    discount: "25% OFF",
    image: "/Images/missguidedimg35pt1.webp",
    hoverImage: "/Images/missguidedimg35pt2.webp",
    category: "tshirts"
  }
];



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


app.locals.users = users;
app.locals.products = products;


app.use((req, res, next) => {
  res.locals.user = req.session.userId
    ? users.find(u => u.id === req.session.userId)
    : null;
  next();
});

const indexRoutes = require('./routes/index');
const productRoutes = require('./routes/product');
const authRoutes = require('./routes/auth');
const checkoutRoutes = require('./routes/checkout');


app.use('/', indexRoutes);
app.use('/', productRoutes);
app.use('/', authRoutes);
app.use('/', checkoutRoutes);



app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found - Missguided' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error - Missguided' });
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;