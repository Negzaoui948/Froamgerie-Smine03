const router = require("express").Router();

const config = require("config");
const Stripe = require("stripe");
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || config.get("STRIPE_SECRET_KEY");
const stripe = new Stripe(stripeSecretKey);

router.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // en centimes
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
