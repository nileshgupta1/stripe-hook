const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const Stripe = require('stripe');
const stripe = Stripe('sk_test_51PS6k6AsLk4sy7mYC9hr7LKxc2Ns11QflJtQFUU2bJq43ijAB0Zm7wp74Vfx0TfHd4FqVrd1DA3wrU28LCUcZNXh00aO1Zvs52');

const app = express();


app.get('/', (req, res) => {
    res.send("Hello World");
});

// If someone pays using the payment link: https://donate.stripe.com/test_6oEcNN6fuaRk2xa144
// the below endpoint will trigger

let endpointSecret = "whsec_QBwcIEqkl9URKtGHGeLJaJtpUT5nSmPk";
app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.async_payment_failed':
            const checkoutSessionAsyncPaymentFailed = event.data.object;
            break;
        case 'checkout.session.completed':
            const checkoutSessionAsyncPaymentSucceeded = event.data.object;
            let email_to = checkoutSessionAsyncPaymentSucceeded.customer_details.email;
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // Use `true` for port 465, `false` for all other ports
                auth: {
                    user: process.env.email,
                    pass: process.env.password,
                },
            });
            async function main() {
                const info = await transporter.sendMail({
                    from: process.env.email, // sender address
                    to: email_to, // list of receivers
                    subject: "Thanks for the payment", // Subject line
                    text: "Thank you for the payment for the product", // plain text body
                    html:
                        `
                    Hello ${email_to}.
                    Thanks for the payment
                    `, // html body
                });

                console.log("Message sent: %s", info.messageId);
            }
            main().catch(console.error);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
});

app.listen(5000, () => {
    console.log('App is listening on port 5000')
})