const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();
const port = 3000;

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let actsToAddToday = [];

let actsToAddWork = [];


let today = new Date();

let options = {
    weekday: "long",
    day: "numeric",
    month: "long"
};

let day = today.toLocaleDateString("en-US", options)

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(process.env.MONGOOSE_CONNECT);

    const todayTodoList = new mongoose.Schema({
        taskName: String
      });

    const Item = mongoose.model("Item", todayTodoList);

    const item1 = new Item({
        taskName: "Welcome to your todolist!"
    });

    const item2 = new Item({
        taskName: "Hit the + button to add a new item"
    });

    const item3 = new Item({
        taskName: "<-- Hit this to delete an item."
    });

    const defaultItems = [item1, item2, item3];

    const listSchema = {
        name: String,
        items: [todayTodoList]
    }

    const List = mongoose.model("List", listSchema);

    app.get("/", async (req, res) => {
        
        try {
            const foundItems = await Item.find();
            if (foundItems.length === 0){
                await Item.insertMany(defaultItems)
                res.redirect("/")
            } else {
                res.render("todayList", {kindOfDay: "Today", actsToAddToday: foundItems});
            }
        } catch (error) {
            console.log(error.message);
        }
        
    })

    app.get("/:customerListName", async (req, res) => {
        const customerListName = _.capitalize(req.params.customerListName);

        const foundList =await List.findOne({name: customerListName});
        if (!foundList) {
            const list = new List({
                name: customerListName,
                items: defaultItems
            })
    
            await list.save();
            res.redirect("/"+customerListName);
        } else {
            res.render("todayList", {kindOfDay: foundList.name, actsToAddToday: foundList.items})
        }


    })
    
    app.post("/", async (req, res) => {
    
        const addedItem = req.body.addToList;
        const listName = req.body.list;

        const item = new Item({
            taskName: addedItem
        })

        if (listName === "Today"){
            item.save()
            res.redirect("/");
        } else {
            let foundList = await List.findOne({name: listName});
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName) 
        }
        
    })

    app.post("/delete", async (req, res) => {
        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName;
        if (listName === "Today"){
            try {
                const result = await Item.findByIdAndRemove(checkedItemId);
                res.redirect("/")
            } catch (error) {
                console.log(error.message);
            } 
        } else {
            try {
                const founList = await List.updateOne({name: listName}, {$pull: {items: {_id: checkedItemId}}});
                res.redirect("/"+listName)
            } catch (error) {
                console.log(error.message);
            }
        }

        //Item.findOneAndRemove ({_id: new mongoose.Types.ObjectId(checkedItemId)});
        
    })
    

}


app.listen(port, () => {
    console.log("server is up on port 3000")
})