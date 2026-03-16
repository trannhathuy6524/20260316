var express = require('express');
var router = express.Router();
let mongoose = require('mongoose')
let { checkLogin } = require('../utils/authHandler.js')
let reservationController = require('../controllers/reservations')

// GET all reservations of current user
router.get('/', checkLogin, async function (req, res, next) {
    try {
        let reservations = await reservationController.GetAllByUser(req.userId)
        res.send(reservations)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

// GET one reservation of current user
router.get('/:id', checkLogin, async function (req, res, next) {
    try {
        let reservation = await reservationController.GetOneByUser(req.params.id, req.userId)
        if (!reservation) {
            return res.status(404).send({ message: "Reservation not found" })
        }
        res.send(reservation)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

// POST reserve all items from user's cart
router.post('/reserveACart', checkLogin, async function (req, res, next) {
    let session = await mongoose.startSession()
    try {
        session.startTransaction()
        let newReservation = await reservationController.ReserveACart(req.userId, session)
        await session.commitTransaction()
        res.send(newReservation)
    } catch (error) {
        await session.abortTransaction()
        res.status(400).send({ message: error.message })
    } finally {
        session.endSession()
    }
})

// POST reserve specific items
router.post('/reserveItems', checkLogin, async function (req, res, next) {
    let session = await mongoose.startSession()
    try {
        session.startTransaction()
        let { items } = req.body
        let newReservation = await reservationController.ReserveItems(req.userId, items, session)
        await session.commitTransaction()
        res.send(newReservation)
    } catch (error) {
        await session.abortTransaction()
        res.status(400).send({ message: error.message })
    } finally {
        session.endSession()
    }
})

// POST cancel a reservation
router.post('/cancelReserve/:id', checkLogin, async function (req, res, next) {
    let session = await mongoose.startSession()
    try {
        session.startTransaction()
        let reservation = await reservationController.CancelReserve(req.params.id, req.userId, session)
        await session.commitTransaction()
        res.send(reservation)
    } catch (error) {
        await session.abortTransaction()
        res.status(400).send({ message: error.message })
    } finally {
        session.endSession()
    }
})

module.exports = router;
