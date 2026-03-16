let reservationModel = require('../schemas/reservations')
let cartModel = require('../schemas/cart')
let inventoryModel = require('../schemas/inventories')
let productModel = require('../schemas/products')

module.exports = {
    GetAllByUser: async function (userId) {
        return await reservationModel.find({ user: userId })
            .populate({
                path: 'items.product',
                select: 'title price images'
            })
    },
    GetOneByUser: async function (id, userId) {
        return await reservationModel.findOne({ _id: id, user: userId })
            .populate({
                path: 'items.product',
                select: 'title price images'
            })
    },
    ReserveACart: async function (userId, session) {
        let currentCart = await cartModel.findOne({ user: userId }).populate({
            path: 'items.product',
            select: 'title price'
        })
        if (!currentCart || currentCart.items.length === 0) {
            throw new Error("Cart is empty")
        }

        let reservationItems = []
        let totalAmount = 0

        for (let item of currentCart.items) {
            let inventory = await inventoryModel.findOne({ product: item.product._id }).session(session)
            if (!inventory || inventory.stock - inventory.reserved < item.quantity) {
                throw new Error(`Product "${item.product.title}" khong du so luong`)
            }
            inventory.reserved += item.quantity
            await inventory.save({ session })

            let subtotal = item.product.price * item.quantity
            reservationItems.push({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price,
                subtotal: subtotal
            })
            totalAmount += subtotal
        }

        let newReservation = new reservationModel({
            user: userId,
            items: reservationItems,
            totalAmount: totalAmount,
            status: "actived",
            ExpiredAt: new Date(Date.now() + 30 * 60 * 1000)
        })
        await newReservation.save({ session })

        currentCart.items = []
        await currentCart.save({ session })

        return newReservation
    },
    ReserveItems: async function (userId, items, session) {
        if (!items || items.length === 0) {
            throw new Error("Items list is empty")
        }

        let reservationItems = []
        let totalAmount = 0

        for (let item of items) {
            let product = await productModel.findOne({ _id: item.product, isDeleted: false })
            if (!product) {
                throw new Error(`Product not found`)
            }

            let inventory = await inventoryModel.findOne({ product: item.product }).session(session)
            if (!inventory || inventory.stock - inventory.reserved < item.quantity) {
                throw new Error(`Product "${product.title}" khong du so luong`)
            }
            inventory.reserved += item.quantity
            await inventory.save({ session })

            let subtotal = product.price * item.quantity
            reservationItems.push({
                product: item.product,
                quantity: item.quantity,
                price: product.price,
                subtotal: subtotal
            })
            totalAmount += subtotal
        }

        let newReservation = new reservationModel({
            user: userId,
            items: reservationItems,
            totalAmount: totalAmount,
            status: "actived",
            ExpiredAt: new Date(Date.now() + 30 * 60 * 1000)
        })
        await newReservation.save({ session })

        return newReservation
    },
    CancelReserve: async function (id, userId, session) {
        let reservation = await reservationModel.findOne({ _id: id, user: userId })
        if (!reservation) {
            throw new Error("Reservation not found")
        }
        if (reservation.status !== "actived") {
            throw new Error("Reservation is not actived")
        }

        for (let item of reservation.items) {
            let inventory = await inventoryModel.findOne({ product: item.product }).session(session)
            if (inventory) {
                inventory.reserved -= item.quantity
                await inventory.save({ session })
            }
        }

        reservation.status = "cancelled"
        await reservation.save({ session })

        return reservation
    }
}
