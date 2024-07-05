import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;
let dataHolder = [];
let sortingType = 'recent'
let currentData = {};

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "booknote",
    password: "Tahlia10.03",
    port: 5432
})
db.connect();

app.use(bodyParser.urlencoded({ extended: true  }));
app.use(express.static("public"));

app.get("/",getData,(req,res)=>{
    res.render("index.ejs",{bookArray: dataHolder, sortingType: sortingType})
})

app.post("/sort",(req,res)=>{
    sortingType = req.body.sortingOption;
    res.redirect("/");
})

app.post("/newBook",(req,res)=>{
    res.render("newBookForm.ejs")
})

//lead to new Book page
app.post("/newBook/addingForm",async (req,res)=>{
    let existed = false; //default to not exist in the database
    try{
        const result = await db.query("SELECT * FROM booknote WHERE isbn = $1",[req.body.isbn]);  
        if(result.rows.length > 0){
            existed = true;  
            res.render("newBook.ejs",{data: {   title: result.rows[0].title,
                                            author: result.rows[0].author,
                                            isbn: result.rows[0].isbn,
                                            coverimglink: result.rows[0].coverimglink,
                                            description: result.rows[0].description,
                                            dateread: result.rows[0].dateread,
                                            rating: result.rows[0].rating,
                                            note: result.rows[0].note }
                                        , editPage: true})
        }
    }
    catch(error){
        console.log(error.message)
    }
    if(!existed){
        const userSearchType = req.body.isbnCode || req.body.bookName + ',' + req.body.authorName;
        const result = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${userSearchType}`);
        const title = result.data.items[0].volumeInfo.title + (result.data.items[0].volumeInfo.subtitle ? ": " + result.data.items[0].volumeInfo.subtitle : "");
        // console.log(result.data.items[0].volumeInfo.title);
        currentData = { title: title,
                        author: result.data.items[0].volumeInfo.authors,
                        isbn: result.data.items[0].volumeInfo.industryIdentifiers[0].identifier,
                        coverimglink: result.data.items[0].volumeInfo.imageLinks.thumbnail,
                        description: result.data.items[0].volumeInfo.description
                    }

        // console.log(currentData);
        res.render("newBook.ejs",{data: currentData, editPage: true});
    }

})


app.post("/newBook/addingForm/added", async (req,res)=>{
    let existed = false; //default to not exist in the database
    try{
        const result = await db.query("SELECT * FROM booknote WHERE isbn = $1",[req.body.isbn]);  
        if(result.rows.length > 0){
            existed = true;  
            await db.query("UPDATE booknote SET dateread= $1 , note = $2, rating = $3",[req.body.dateRead,req.body.noteArea,req.body.rating])
        }
    }
    catch(error){
        console.log(error.message)
    }
    if(!existed){
        try{
            await db.query("INSERT INTO booknote(title,author,dateread,coverimglink,note,rating,isbn,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[req.body.title,req.body.author,req.body.dateRead,req.body.coverimglink,req.body.noteArea,req.body.rating,req.body.isbn,req.body.description]);
        }
        catch(error){
            console.log(error.message)
        }
       
    }
res.redirect('/');
})
app.post("/:id",async (req,res)=>{
    let result = [];
    try{
        result = await db.query("SELECT * FROM booknote WHERE id = $1",[parseInt(req.params.id)]);
    }
    catch(error){
        console.log(error.message)
    }
    res.render("newBook.ejs",{data: result.rows[0], editPage: false})
    
})

app.post("/newBook/addingForm/deleted",async(req,res)=>{
    try{
        await db.query("DELETE FROM booknote WHERE isbn = $1",[req.body.isbn])
    }
    catch(error){
        console.log(error.message)
    }
    res.redirect("/");
})

async function getData(req,res,next){
    let result = [];
    if(sortingType === 'recent'){
        result = await db.query("SELECT * FROM booknote ORDER BY dateread DESC");
    }
    else if(sortingType === "rating"){
        result = await db.query("SELECT * FROM booknote ORDER BY rating DESC");
    }
    else if(sortingType === "title"){
        result = await db.query("SELECT * FROM booknote ORDER BY title");
    }
    dataHolder = result.rows;
    next();
}

app.listen(port, ()=>{
    console.log(`App is currently running on port ${port}`)
})
