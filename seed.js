const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const roleModel = require('./schemas/roles')
const userModel = require('./schemas/users')
const productModel = require('./schemas/products')
const inventoryModel = require('./schemas/inventories')
const cartModel = require('./schemas/cart')

async function seed() {
    await mongoose.connect('mongodb://localhost:27017/')
    console.log('Connected to MongoDB')

    // Xoa du lieu cu
    await roleModel.deleteMany({})
    await userModel.deleteMany({})
    await productModel.deleteMany({})
    await inventoryModel.deleteMany({})
    await cartModel.deleteMany({})
    console.log('Cleared old data')

    // Tao roles
    const [adminRole, userRole] = await roleModel.insertMany([
        { name: 'ADMIN', description: 'Administrator' },
        { name: 'USER', description: 'Regular user' }
    ])
    console.log('Roles created:', adminRole._id, userRole._id)

    // Hash password truoc (vi pre-save hook khong goi next())
    const hashedPassword = bcrypt.hashSync('Test@1234', 10)

    // Tao users
    const [adminUser, testUser] = await userModel.insertMany([
        {
            username: 'admin',
            password: hashedPassword,
            email: 'admin@test.com',
            fullName: 'Admin User',
            role: adminRole._id,
            status: true
        },
        {
            username: 'testuser',
            password: hashedPassword,
            email: 'user@test.com',
            fullName: 'Test User',
            role: userRole._id,
            status: true
        }
    ])
    console.log('Users created')

    // Tao products
    const products = await productModel.insertMany([
        {
            title: 'iPhone 15 Pro',
            slug: 'iphone-15-pro',
            description: 'Apple iPhone 15 Pro 256GB',
            price: 999,
            category: 'Electronics'
        },
        {
            title: 'Samsung Galaxy S24',
            slug: 'samsung-galaxy-s24',
            description: 'Samsung Galaxy S24 128GB',
            price: 799,
            category: 'Electronics'
        },
        {
            title: 'MacBook Pro M3',
            slug: 'macbook-pro-m3',
            description: 'Apple MacBook Pro 14 inch M3',
            price: 2499,
            category: 'Laptops'
        }
    ])
    console.log('Products created')

    // Tao inventories cho tung product
    await inventoryModel.insertMany(
        products.map(p => ({
            product: p._id,
            stock: 100,
            reserved: 0,
            soldCount: 0
        }))
    )
    console.log('Inventories created')

    // Tao carts
    await cartModel.insertMany([
        { user: adminUser._id, items: [] },
        {
            user: testUser._id,
            items: [
                { product: products[0]._id, quantity: 2 },
                { product: products[1]._id, quantity: 1 }
            ]
        }
    ])
    console.log('Carts created')

    console.log('\n========== SEED COMPLETED ==========')
    console.log('\nLogin credentials:')
    console.log('  Admin : username=admin     | password=Test@1234')
    console.log('  User  : username=testuser  | password=Test@1234')
    console.log('\nRole IDs:')
    console.log('  ADMIN :', adminRole._id.toString())
    console.log('  USER  :', userRole._id.toString())
    console.log('\nUser IDs:')
    console.log('  admin    :', adminUser._id.toString())
    console.log('  testuser :', testUser._id.toString())
    console.log('\nProduct IDs:')
    products.forEach(p => console.log(`  ${p.title.padEnd(20)}: ${p._id.toString()}`))
    console.log('=====================================\n')

    await mongoose.disconnect()
}

seed().catch(err => {
    console.error('Seed failed:', err)
    process.exit(1)
})
