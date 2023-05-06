let db=require('../configure/connection')
var collection=require('../configure/collections')
var ObjectId=require('mongodb').ObjectId
const bcrypt= require('bcrypt')
const { response } = require('express')

module.exports={
    addProduct:(Product,Callback)=>{
        console.log(Product);
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(Product).then((data)=>{
            console.log(data)
            Callback(data.insertedId)
        })
        
    },
    getallProducts:()=>{
        return new Promise(async (resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProducts:(id)=>{
        return new Promise( (resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id: new ObjectId(id)}).then((response)=>{
                console.log(id)
                resolve(response);
            })
        })
    },
    getProductDetails:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id: new ObjectId(id)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id: new ObjectId(proId)},{
                $set:{
                   Name:proDetails.Name,
                   Title:proDetails.Title,
                    Price:proDetails.Price,
                    Category:proDetails.Category,
                    Description:proDetails.Description,
                }
            }).then((response)=>{
                resolve();
            })
        })
    },
    doSignup:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            adminData.Password=await bcrypt.hash(adminData.Password,10);
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((data)=>{
                resolve(data.insertedId)
            })
        })
    },
    doLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false;
            let response={}
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:adminData.email})
            if(admin){
                bcrypt.compare(adminData.Password,admin.Password).then((status)=>{
                    if(status){
                        console.log("Login Success");
                        response.admin=admin;
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
    getAllorders:()=>{
        return new Promise((resolve, reject) => {
            let orders=db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },
    getOrderProduct:(orderId)=>{
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
    getAllUsers:()=>{
        return new Promise((resolve, reject) => {
            let users=db.get().collection(collection.USER_COLLECTION).find().toArray();
            resolve(users);
        })
    },
    getUserdetails:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let user=await db.get().collection(collection.USER_COLLECTION)
                .findOne({_id:new ObjectId(userId)})
                console.log(user)
            resolve(user)
        })
    },
    getOrderdetails:(userId)=>{
        return new Promise(async(resolve, reject) => {
            let order=await db.get().collection(collection.ORDER_COLLECTION)
                .find({userId:new ObjectId(userId)}).toArray();
            console.log(order)
            resolve(order)
        })
    }
}