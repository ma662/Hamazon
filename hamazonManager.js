// initialize dependencies
var mysql = require("mysql");
var inquirer = require('inquirer');
const cTable = require('console.table');

// configure connection
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,

    user: "root",
    password: "root",
    database: "hamazon"
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");

    app.main_menu();
});

var app = {
    main_menu: function () {
        var choicesArr = ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Quit"];

        inquirer
            .prompt([
                {
                    name: "selection",
                    type: "list",
                    message: "Welcome, Hamazon Manager!",
                    choices: choicesArr
                }
            ])
            .then(answers => {
                switch (answers.selection) {
                    case choicesArr[0]:
                        return app.display();

                    case choicesArr[1]:
                        return app.displayLow();

                    case choicesArr[2]:
                        return app.addInventory.select();

                    case choicesArr[3]:
                        return app.addProduct.conf();

                    default:
                        console.log("Okay, goodbye!");
                        connection.end();
                        return process.exit();
                }
            });
    },

    display: function () {
        connection.query("SELECT * FROM products",
            function (err, res) {
                for (var i = 0; i < res.length; i++) {
                    // format price
                    res[i].price = "$ " + parseFloat(Math.round(res[i].price * 100) / 100).toFixed(2);
                }
                console.log("\n");
                console.table(res);

                return app.main_menu();
            });
    },

    displayLow: function () {
        connection.query("SELECT * FROM products WHERE `stock_quantity` < ?",
            [10],
            function (err, res) {
                for (var i = 0; i < res.length; i++) {
                    // format price
                    res[i].price = "$ " + parseFloat(Math.round(res[i].price * 100) / 100).toFixed(2);
                }
                console.log("\n");
                console.table(res);

                return app.main_menu();
            });
    },

    addInventory: {

        select: function () {
            var idChoices = []; // 1 - Ham Sandwich

            connection.query("SELECT * FROM products",
                function (err, res) {
                    for (var i = 0; i < res.length; i++) {
                        res[i].price = parseFloat(Math.round(res[i].price * 100) / 100).toFixed(2);
                        idChoices.push(res[i].item_id + " - " + res[i].product_name + " ($" + res[i].price + ") [Quant. " + res[i].stock_quantity + "]");
                    }

                    idChoices.push("Back");

                    inquirer
                        .prompt([
                            {
                                name: "id-sel",
                                type: "list",
                                message: "What would you like to purchase?",
                                choices: idChoices
                            }
                        ])
                        .then(function (answer) {
                            if (answer['id-sel'] === 'Back') {
                                return app.main_menu();
                            }
                            else {
                                return app.addInventory.modify(answer['id-sel']);
                            }
                        });
                });
        },

        modify: function (selection) {
            var id = selection.split(' ')[0];

            inquirer
                .prompt([
                    {
                        name: "amount",
                        type: "input",
                        message: "How much inventory are you adding to this selection?",
                        validate: function (value) {
                            if (value > 0) {
                                return true;
                            }
                            else {
                                console.log('\nInvalid amount\n');
                                return false;
                            }
                        }
                    }
                ])
                .then(function (answer) {
                    connection.query('SELECT stock_quantity FROM products WHERE ?',
                        [{
                            item_id: id
                        }],
                        function (err, res) {
                            var sq = res[0].stock_quantity;
                            var newSq = sq + parseInt(answer.amount);

                            connection.query('UPDATE products SET stock_quantity=? WHERE ?',
                                [
                                    newSq,
                                    {
                                        item_id: id
                                    }
                                ],
                                function (err, res) {
                                    console.log(res.affectedRows + " item updated!\n");

                                    return app.main_menu();
                                });
                        });
                });
        },
    },

    addProduct: {
        p_object: {},

        conf: function () {
            inquirer
                .prompt([
                    {
                        name: "conf",
                        type: "confirm",
                        message: "Confirm Add Product?"
                    }
                ])
                .then(function (answer) {
                    if (answer.conf) {
                        return app.addProduct.set_name();
                    }
                    else {
                        return app.main_menu();
                    }
                });
        },

        set_name: function () {
            inquirer
                .prompt([
                    {
                        name: "name",
                        type: "input",
                        message: "Enter Product Name: ",
                        validate: function (value) {
                            if (value.length === 0) {
                                console.log("Invalid input.");
                                return false;
                            }
                            return true;
                        }
                    }
                ])
                .then(function (answer) {
                    connection.query('SELECT * FROM products WHERE ?',
                        [
                            {
                                product_name: answer.name
                            }
                        ],
                        function (err, res) {
                            // check if exists
                            if (res.length > 0) {
                                console.log("Product already listed. That's a no-no. Cancelling.")
                                return app.main_menu();
                            }
                            // add to product object
                            app.addProduct.p_object.item_name = answer.name;

                            return app.addProduct.set_dept();
                        });

                });

        },

        set_dept: function () {
            inquirer
                .prompt([
                    {
                        name: "dept",
                        type: "list",
                        message: "Select a Department Name: ",
                        choices: ["Foods", "Home", "Toys", "Kids", "Electronics", "Shoes", "Clothing"]
                    }
                ])
                .then(function (answer) {
                    app.addProduct.p_object.dept = answer.dept;
                    return app.addProduct.set_price();
                });
        },

        set_price: function () {
            inquirer
                .prompt([
                    {
                        name: "price",
                        type: "input",
                        message: "Enter a Price for your Item: ",

                        validate: function (value) {
                            if (value > 0) {
                                return true;
                            }
                            else {
                                console.log('\nInvalid Price\n');
                                return false;
                            }
                        }
                    }
                ])
                .then(function (answer) {
                    var price = parseFloat(Math.round(answer.price * 100) / 100).toFixed(2);

                    app.addProduct.p_object.price = price;
                    return app.addProduct.set_sq();
                });
        },

        set_sq: function () {
            inquirer
                .prompt([
                    {
                        name: "quantity",
                        type: "input",
                        message: "Enter a Quantity for your Item: ",

                        validate: function (value) {
                            if (value >= 0) {
                                return true;
                            }
                            else {
                                console.log('\nInvalid Quantity\n');
                                return false;
                            }
                        }
                    }
                ])
                .then(function (answer) {
                    var stock_quantity = answer.quantity;

                    app.addProduct.p_object.stock_quantity = stock_quantity;
                    return app.addProduct.update();
                });

        },

        update: function () {
            var tableArr = [];
            var newObj = {};

            for (var i = 0; i < Object.keys(app.addProduct.p_object).length; i++) {
                var thisProp = Object.keys(app.addProduct.p_object)[i];
                var thisVal = app.addProduct.p_object[Object.keys(app.addProduct.p_object)[i]];

                newObj[thisProp] = thisVal;
            }
            tableArr.push(newObj);
            console.table("\ninformation", tableArr);

            inquirer
                .prompt([
                    {
                        name: "conf",
                        type: "confirm",
                        message: "Is this correct?",
                    }
                ])
                .then(function (answer) {
                    if (answer.conf) {
                        connection.query("INSERT INTO products SET ?",
                            [
                                {
                                    product_name: app.addProduct.p_object.item_name,
                                    department_name: app.addProduct.p_object.dept,
                                    price: app.addProduct.p_object.price,
                                    stock_quantity: app.addProduct.p_object.stock_quantity
                                }
                            ],
                            function (err, res) {
                                if (err) throw (err);

                                console.log(res.affectedRows + " item updated!\n");
                                return app.main_menu();
                            });

                    }
                    else {
                        return app.main_menu();
                    }
                });
        },
    },
};