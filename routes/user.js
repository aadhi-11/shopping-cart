var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');
const userhelpers=require('../helpers/user-helpers');
const session = require('express-session');
const userHelpers = require('../helpers/user-helpers');

const verifyLogin=(req,res,next)=>{
  if(req.session.user){
    next();
  }
  else{
    res.redirect('/login')
  }
};

/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user;
  let cartCount=null;
  if(req.session.user)
  {
  cartCount= await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getallProducts().then((products)=>{
    res.render('user/view-products', { products,user,cartCount});
    
  })
 
});
router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/');
  }
  else{
    res.render('user/login',{"LoginErr":req.session.useroginErr});
    req.session.userLoginErr=false;
  }
  
});
router.get('/signup',(req,res)=>{
  res.render('user/signup')
});
router.post('/signup',(req,res)=>{
  userhelpers.doSignup(req.body).then((response)=>{
    req.session.user=response;
    req.session.user.loggedIn=true;
    res.redirect('/')
  })
})

router.post('/login',(req,res)=>{
  userhelpers.doLogin(req.body).then((response)=>{
    if(response.status)
    { 
      
      req.session.user=response.user;
      req.session.user.loggedIn=true;
      res.redirect('/')
    }
    else{
      req.session.userLoginErr=true;
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.user=null;
  res.redirect('/')
})

router.get('/cart',verifyLogin,async (req,res)=>{
  let products=await userhelpers.getCartProducts(req.session.user._id);
  let total=0;
  if(products.length>0){
    total=await userHelpers.getTotalAmount(req.session.user._id);
  }
  let user=req.session.user;
  res.render('user/cart',{products,user,total})
})

router.get('/add-to-cart/:id',(req,res)=>{
  console.log("Api call")
  let proid=req.params.id;
  let userid=req.session.user._id;
  userhelpers.addToCart(proid,userid).then(()=>{
    
    res.json({status:true})
  })
})

router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body)
  userHelpers.changeProductQuantity(req.body).then(async (response)=>{
    response.total=  await userHelpers.getTotalAmount(req.session.user._id)
    res.json(response)
  })
})

router.post('/delete-cart-item',(req,res,next)=>{
  userHelpers.deleteCartItem(req.body).then((response)=>{
      res.json(response)
  })
})
router.get('/place-order',verifyLogin ,async (req,res)=>{
  let total= await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  
  let products =await userhelpers.getProductList(req.body.user);
  let totalPrice =await userHelpers.getTotalAmount(req.body.user);
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment']=='COD')
    {
      res.redirect('/order-success')
    }
    else if(req.body['payment']=='Online')
    {
      userhelpers.generateRazorpay(orderId).then((response)=>{
        
      })
    }
    
  })
})
router.get('/order-success',(req,res)=>{
  let user=req.session.user
  res.render('user/order-success',{user});
})
router.get('/orders',async(req,res)=>{
  let user= req.session.user
  let order=await userHelpers.getOrders(user._id)
  res.render('user/orders',{user,order})
})
router.get('/order-products/:id',async(req,res)=>{
  let user=req.session.user
  let products=await userhelpers.getOrderProducts(req.params.id)
  console.log(products);
  res.render('user/order-products',{user,products})
});
router.get('/profile',verifyLogin,(req,res)=>{
  let user=req.session.user;

  res.render('user/profile',{user});
})
router.post('/gender',(req,res,next)=>{
  let userId=req.session.user._id;
  let user=req.session.user;
  let gender=req.body.Gender
  console.log(gender)
  userHelpers.genderUpdate(userId,gender).then(()=>{
    res.redirect('/profile');
  })
});
router.post('/phone',(req,res,next)=>{
  let userId=req.session.user._id;
  let user=req.session.user;
  let phone=req.body.phone
  userHelpers.phoneUpdate(userId,phone).then(()=>{
    res.redirect('/profile');
  })
});




module.exports = router;
