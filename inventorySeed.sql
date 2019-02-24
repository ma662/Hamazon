DROP DATABASE IF EXISTS hamazon;
CREATE DATABASE hamazon;
USE hamazon;

CREATE TABLE products (
	item_id INTEGER AUTO_INCREMENT NOT NULL,
    product_name VARCHAR (64) NOT NULL,
    department_name VARCHAR (32) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER NOT NULL,
    
    PRIMARY KEY (item_id)
);

INSERT INTO products (product_name, department_name, price, stock_quantity)
VALUES 
("Ham Sandwich", "Foods", 4.00, 17),
("Ham on Crackers", "Foods", 2.50, 12),
("Piggy Bank", "Home", 15.00, 9),
("Pin the Tail on the Pig", "Toys", 20.00, 25),
("Ham and Cheese", "Foods", 3.50, 5),
("Hamburger", "Foods", 4.00, 45),
("Piggie Plush", "Toys", 25.00, 50),
("Piggie Shades", "Kids", 15.00, 15),
("Ham Fries", "Foods", 4.00, 100),
("Hamtaro Plush", "Toys", 35.00, 7);

SELECT * FROM products;