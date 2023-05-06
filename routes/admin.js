var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');
const session = require('express-session');
const userhelpers=require('../helpers/user-helpers');

const verifyLogin=(req,res,next)=>{
  if(req.session.admin){
    next()
  }
  else{
    res.redirect('/admin/alogin')
  }
}
/* GET users listing. */
router.get('/',verifyLogin, function(req, res,next) {
  productHelpers.getallProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products})
  })
 
});

router.get('/add-product',verifyLogin, function(req,res){
  res.render('admin/add-product',{admin:true})
});

router.post('/add-product',(req,res)=>{

  productHelpers.addProduct(req.body,(insertedId)=>{
    let image =req.files.img;
    console.log(insertedId);
    image.mv('./public/product-images/'+insertedId+'.jpg',(err)=>{
      if(!err){
        res.render('admin/add-product',{admin:true})
      }
      else{
        console.log(err)
      }
    })
    
  })
  
})
router.get('/delete-product/',verifyLogin ,(req,res)=>{
  
  let proId=req.query.id;
 
  productHelpers.deleteProducts(proId).then((response)=>{
    res.redirect('/admin');
  })
  
  
});

router.get('/edit-product/',verifyLogin ,async (req,res)=>{
  let prodid=req.query.id;
  let product=await productHelpers.getProductDetails(prodid);
  res.render('admin/edit-product',{product,admin:true});
});
router.post('/edit-product/',(req,res)=>{
  let id=req.query.id;
  productHelpers.updateProduct(id,req.body).then(()=>{
    res.redirect('/admin');
    if(req.files.img)
    { 
      let image =req.files.img;
      image.mv('./public/product-images/'+id+'.jpg');
    }
  })
});
router.get('/alogin',(req,res)=>{
  if(req.session.admin){
    res.redirect('/admin',{admin:true});
  }
  else{
    res.render('admin/admin-login',{"LoginErr":req.session.adminLoginErr,admin:true});
    req.session.adminLoginErr=false;
  }
});
router.get('/asignup',(req,res)=>{
  res.render('admin/admin-signup');
});
router.post('/asignup',(req,res)=>{
  productHelpers.doSignup(req.body).then((response)=>{
    req.session.admin=response
    req.session.admin.loggedIn=true;
    res.redirect('/admin')
  })
});
router.post('/alogin',(req,res)=>{
  productHelpers.doLogin(req.body).then((response)=>{
    if(response.status)
    { 
      
      req.session.admin=response.admin;
      req.session.admin.loggedIn=true;
      res.redirect('/admin')
    }
    else{
      req.session.adminLoginErr=true;
      res.redirect('/admin/alogin');
    }
  })
});
router.get('/all-orders',verifyLogin,(req,res)=>{
  productHelpers.getAllorders().then((orders)=>{
    res.render('admin/all-orders',{admin:true,orders});
  })
  
});
router.get('/order-product/:id',verifyLogin,async(req,res)=>{
  
  let products=await productHelpers.getOrderProduct(req.params.id)

  res.render('admin/order-product',{admin:true,products})
})
router.get('/all-user',verifyLogin,(req,res)=>{
  productHelpers.getAllUsers().then((users)=>{
    console.log(users)
    res.render('admin/all-users',{admin:true,users})
  })
});
router.get('/user',(req,res)=>{
  let userId=req.query.id;
  console.log(userId);
  productHelpers.getUserdetails(userId).then((user)=>{
    res.render('admin/specific-user',{user,admin:true})
  })
})
router.get('/orders',(req,res)=>{
  let userId=req.query.id;
  console.log(userId);
  productHelpers.getOrderdetails(userId).then((orders)=>{
    res.render('admin/orders',{admin:true,orders})
  })
});
router.get('/products',async(req,res)=>{
  let orderId=req.query.id;
  let products=await userhelpers.getOrderProducts(orderId);
  res.render('admin/products',{admin:true,products})
})
module.exports = router;
