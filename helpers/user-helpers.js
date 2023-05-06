let db=require('../configure/connection')
var collection=require('../configure/collections')
const bcrypt= require('bcrypt')
const { ObjectId } = require('mongodb')
const collections = require('../configure/collections')
const { response } = require('express')

module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10);
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.insertedId)
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false;
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("Login Success");
                        response.user=user;
                        response.status=true;
                        resolve(response)
                    }
                    else{
                        resolve({status:false})
                        console.log("Login failed due to wrong password");
                    }
                })
            }
            else{
                console.log("Login failed due to not found email")
                resolve({status:false})
            }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:new ObjectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
            if(userCart){
                let proExist=userCart.products.findIndex(product=>product.item==proId)
                console.log(proExist);
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:new ObjectId(userId),'products.item':new ObjectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }
                else{    
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:new ObjectId(userId)},
                    {
                        $push:{products:proObj}
                    }
                    ).then((response)=>{
                    resolve()
                    })
                }
            }else{
                let cartObj={
                    user:new ObjectId(userId),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve();
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let cartitems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',

                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

            ]).toArray()

            resolve(cartitems);
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let count=0;
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
            if(cart){
                count=cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        count=parseInt(details.count);
        quantity=parseInt(details.quantity)

        return new Promise((resolve, reject) => {
            if(count==-1 && quantity==1){
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:new ObjectId(details.cart)},
                    {
                        $pull:{products:{item:new ObjectId(details.product)}}
                    }).then((response)=>{
                        resolve({removeProduct:true})
                    })   
            }else{
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:new ObjectId(details.cart),'products.item':new ObjectId(details.product)},
                    {
                        $inc:{'products.$.quantity':count}
                    }
                    ).then((response)=>{
                        
                        resolve({status:true});
                    }) 
            }
        })
    },
    deleteCartItem:(details)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:new ObjectId(details.cart)},
                {
                    $pull:{products:{item:new ObjectId(details.product)}}
                }).then((response)=>{
                    resolve({removeProduct:true})
                })   
                
        })
    },
    getTotalAmount:(userId)=>{
        
        return new Promise(async(resolve, reject) => {
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new ObjectId(userId)}
                    
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:{$toInt:'$products.quantity'},
                        

                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:[{$toInt:'$quantity'},{$toInt:'$product.Price'}]}}
                    }
                }

            ]).toArray()
            
            
            resolve(total[0].total);
        })
    },
    getProductList:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
            
            resolve(cart.products)
        })
    },
    placeOrder:(order,products,total)=>{
        return  new Promise((resolve, reject) => {
            console.log(products,total,order)
            let status=order.payment==='COD'?'placed':'pending';
            let orderObj={
                deliveryDetails:{
                    mobile:order.phone,
                    address:order.Address,
                    pincode:order.pincode
                },
                userId:new ObjectId(order.user),
                paymentMethod:order.payment,
                products:products,
                totalAmout:total,
                status:status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:new ObjectId(orderObj.userId)})
                resolve(response.insertedId)
            })
        })
    },
    getOrders:(userId)=>{
        return new Promise(async(resolve, reject) => {
            console.log("userid is :"+userId)
            let order=await db.get().collection(collection.ORDER_COLLECTION)
                .find({userId:new ObjectId(userId)}).toArray()
            
            resolve(order)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve, reject) => {
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:new ObjectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }

            ]).toArray()
            resolve(orderItems);
        })
    },
    genderUpdate:(userId,gender)=>{
        console.log(gender)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: new ObjectId(userId) },{
                $set:{Gender:gender}
            })
            resolve();
        })
    },
    phoneUpdate:(userId,phone)=>{
        console.log(phone)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: new ObjectId(userId) },{
                $set:{phone:phone}
            })
            resolve();
        })
    },
    
    
}
