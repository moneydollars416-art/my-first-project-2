const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let menu = [
  { id: 1, name: "Бургер", price: 250 },
  { id: 2, name: "Пицца", price: 450 },
  { id: 3, name: "Латте", price: 180 },
  { id: 4, name: "Картофель фри", price: 150 },
  { id: 5, name: "Кола", price: 100 }
];

let orders = [];

// Менюну алуу
app.get("/api/menu", (req, res) => {
  res.json(menu);
});

// Жаңы заказ кошуу
app.post("/api/orders", (req, res) => {
  const order = {
    id: Date.now(),
    items: req.body.items,
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  res.status(201).json(order);
});

// Заказдарды алуу
app.get("/api/orders", (req, res) => {
  res.json(orders);
});

app.listen(3000, () => {
  console.log("CafeOS API: http://localhost:3000");
});