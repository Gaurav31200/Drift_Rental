const express = require("express");
const bodyParser = require("body-parser");
const lodash = require("lodash");
const ejs = require("ejs");
const mysql = require("mysql");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs');


var db_config = {
  host: "remotemysql.com",
  user: "G46nsVWf7x",
  port: 3306,
  database: "G46nsVWf7x",
  password: "ahtV4JNY96"
};

var connection;

function handleDisconnect() {
  connection = mysql.createConnection(db_config);

  connection.connect(function (err) {
    if (err) {
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } else {
      console.log("Connected to database");
    }
  });

  connection.on('error', function (err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect(); // lost due to either server restart, or a
    } else { // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}

handleDisconnect();

let newUserUrl = "/Register";
let rentId;
let issueId;

app.get("/", function (req, res) {
  if (newUserUrl === "/Register") {
    res.render("home");
  } else {
    res.render("newUser", {
      newUser: newUserUrl
    });
  }
});

app.get("/Register", function (req, res) {
  res.render("register", {
    newUser: newUserUrl
  });
});

app.get("/Contact-Us", function (req, res) {
  res.render("contact", {
    newUser: newUserUrl
  });
});

app.get("/Developers", function (req, res) {
  res.render("developers");
});

app.get("/Choose-Car", function (req, res) {
  res.render("carlist", {
    newUser: newUserUrl
  });
});

app.get("/rentCar/:carName", function (req, res) {
  const car_img = req.params.carName;
  let carModel = lodash.toUpper(req.params.carName);
  let carAvail = "";
  let sql = "SELECT * FROM car WHERE Car_model ='" + carModel + "'";
  connection.query(sql, function (err, findCar) {
    if (err) {
      console.log(err);
    } else {

      if (findCar[0].Avail_flag === 'A') {
        carAvail = "Available";
      } else {
        carAvail = "Not-Available";
      }

      let sql2 = "SELECT Location_name FROM location WHERE Location_id = '" + findCar[0].Location_id + "' ";
      connection.query(sql2, function (err, findLocation) {
        if (err) {
          console.log(err);
        } else {
          res.render("rent", {
            newUser: newUserUrl,
            carImage: car_img,
            carDetail: findCar[0],
            avail: carAvail,
            locationName: findLocation[0].Location_name
          });
        }
      });
    }
  });
});

app.get("/Register/:user", function (req, res) {
  const userName = lodash.capitalize(req.params.user);

  let sql2 = "SELECT * FROM customer WHERE Customer_id='" + userName + "'";

  connection.query(sql2, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      res.render("user", {
        user: foundUser[0]
      });
    }
  });
});

app.post("/Register", function (req, res) {

  let sql = "INSERT INTO customer VALUES('" + req.body.username + "','" + req.body.password + "','" + req.body.firstName + "','" + req.body.lastName + "','" + req.body.aadharNo + "','" + req.body.address + "','" + req.body.contact + "','" + req.body.email + "')";
  connection.query(sql, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Inserted");
    }
  });
  res.redirect("/Register");
});

app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  let sql = "SELECT Customer_id,Password FROM customer WHERE Customer_id='" + username + "'";
  connection.query(sql, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
      if (result[0].Password === password) {
        let sql2 = "SELECT * FROM customer WHERE Customer_id='" + username + "'";

        connection.query(sql2, function (err, foundUser) {
          if (err) {
            console.log(err);
          } else {
            newUserUrl = "/Register/" + username;
            res.redirect("/");
          }
        });

      } else {
        console.log("Username doesnot exist signup first");
        res.redirect("/Register");
      }
    }
  });
});

app.post("/logout", function (req, res) {
  newUserUrl = "/Register";
  res.redirect("/");
})

app.post("/rent", function (req, res) {

  let sql4 = "SELECT Rent_id FROM rent WHERE Rent_id=(SELECT max(Rent_id) FROM rent)";
  connection.query(sql4, function (err, id) {
    if (err) {
      console.log(err);
    } else {
      rentId = id[0].Rent_id + 1;
    }
  });
  const userName = newUserUrl.substring(10);
  console.log(userName);
  let sql = "SELECT Customer_id FROM customer WHERE Customer_id='" + userName + "' ";
  connection.query(sql, function (err, found) {
    if (err) {
      console.log(err);
    } else {
      console.log(found);
      if (found === []) {
        res.redirect("/Register");
      } else {

        let sql2 = "INSERT INTO rent VALUES('" + rentId + "','" + req.body.fromDate + "','" + req.body.returnDate + "','" + req.body.plateNo + "','" + userName + "','" + req.body.pickup_id + "','" + req.body.drop_id + "')";
        connection.query(sql2, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Booked");
          }
        });

        let sql3 = "UPDATE car SET Avail_flag = 'N' WHERE car.Plate_no = '" + req.body.plateNo + "' ";
        connection.query(sql3, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("updated car table");
          }
        });

        res.render("success");

      }
    }
  });

});

// app.post("/signOut", function (req, res) {
//   res.render("signout", {
//     username: customer
//   });
// });

app.post("/issues", function (req, res) {
  let sql = "SELECT Issue_id FROM issue WHERE Issue_id=(SELECT max(Issue_id) FROM issue)";
  connection.query(sql, function (err, id) {
    if (err) {
      console.log(err);
    } else {
      issueId = id[0].Issue_id;
      issueId++;
      // console.log(issueId);
      let sql2 = "INSERT INTO issue VALUES('" + issueId + "','" + req.body.userName + "','" + req.body.name + "','" + req.body.userMail + "','" + req.body.userMessage + "')";
      connection.query(sql2, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Registered");
        }
      });
      res.redirect("/");
    }
  });

});

app.listen(process.env.PORT, function () {
  console.log("The server has started successfully!");
});
