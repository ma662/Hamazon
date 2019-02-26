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
        inquirer
            .prompt([
                {
                    name: "selection",
                    type: "list",
                    message: "Welcome to Hamazon!",
                    choices: ["Display All Products", "Purchase a Product", "Quit"]
                }
            ])
            .then(answers => {
                switch (answers.selection) {
                    case "Display All Products":
                        return app.display(true);

                    case "Purchase a Product":
                        return app.purchase.p_conf();

                    default:
                        console.log("Okay, goodbye!");
                        connection.end();
                        return process.exit();
                }
            });
    },

    // fires on boot
    display: function (rerun) {

        connection.query("SELECT * FROM products",
            function (err, res) {
                for (var i = 0; i < res.length; i++) {
                    // format price
                    res[i].price = "$ " + parseFloat(Math.round(res[i].price * 100) / 100).toFixed(2);
                }
                console.log("\n");
                console.table(res);

                if (rerun) {
                    return app.main_menu();
                }

                return;
            });
    },

    purchase: {
        p_conf: function () {
            app.display(false);

            inquirer
                .prompt([
                    {
                        name: "conf",
                        type: "confirm",
                        message: "Would you like to purchase an item?",
                    }
                ])
                .then(answers => {
                    if (answers.conf) {
                        var idChoices = []; // 1 - Ham Sandwich

                        connection.query("SELECT * FROM products",
                            function (err, res) {
                                for (var i = 0; i < res.length; i++) {
                                    res[i].price = parseFloat(Math.round(res[i].price * 100) / 100).toFixed(2);
                                    idChoices.push(res[i].item_id + " - " + res[i].product_name + " ($" + res[i].price + ") [Quant. " + res[i].stock_quantity + "]");
                                }

                                return app.purchase.p_select(idChoices);
                            });
                    }
                    else {
                        return app.main_menu();
                    }
                });
        },

        p_select: function (choice_arr) {

            inquirer
                .prompt([
                    {
                        name: "id-sel",
                        type: "list",
                        message: "What would you like to purchase?",
                        choices: choice_arr
                    }
                ])
                .then(answers => {
                    var id = answers['id-sel'].split(' ').slice(0, 1);

                    // specific item
                    connection.query("SELECT * FROM products WHERE ?",
                        [
                            {
                                item_id: id,
                            }
                        ],
                        function (err, res) {
                            var itemObj = {
                                id: res[0].item_id,
                                item: res[0].product_name,
                                item_q: res[0].stock_quantity,
                                item_price: res[0].price
                            }

                            if (itemObj.item_q < 1) {
                                console.log("\nThat product is currently sold out.\n");
                                return app.main_menu();
                            }
                            else {
                                app.purchase.p_quant(itemObj);
                            }
                        });
                });
        },

        p_quant: function (itemObject) {
            var id = itemObject.id;
            var item = itemObject.item;
            var item_q = itemObject.item_q;
            var item_price = itemObject.item_price;

            inquirer
                .prompt([
                    {
                        name: "quantity",
                        type: "input",
                        message: "What quantity would you like to purchase for " + "[" + item + "] ?",
                        validate: function (value) {
                            if (value <= item_q && value > -1) {
                                return true;
                            }
                            else {
                                console.log("\nNot a valid quantity amount.\n");
                                return false;
                            }
                        }
                    }
                ])
                .then(answers => {
                    console.table('\ninformation for human being', ([
                        {
                            item: item,
                            price: item_price,
                            amount: answers.quantity,
                            "your total": "$ " + item_price * answers.quantity,
                        }
                    ])
                    );
                    inquirer
                        .prompt([
                            {
                                name: "resp",
                                type: "confirm",
                                message: "Does this information look correct?",
                            }
                        ])
                        .then(function (answer) {
                            if (answer.resp) {
                                connection.query('UPDATE products SET ? WHERE ?',
                                    [
                                        { stock_quantity: item_q - answers.quantity },
                                        { item_id: id }
                                    ],
                                    function (err, res) {
                                        if (err) throw (err);
                                        console.log("\nOrder processed.");
                                        console.log(res.affectedRows + " item updated!\n");
                                        return app.main_menu();
                                    });
                            }
                            else {
                                console.log("No problem.\n");
                                return app.main_menu();
                            }
                        });
                });
        }
    },
};