require('dotenv').config();
const express = require('express');
const {google} = require('googleapis');

const app = express()
const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET,process.env.REDIRECT);
app.use(express.json());

app.get('/',(req,res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type:'offline',
        scope:'https://www.googleapis.com/auth/calendar'
    });
    res.redirect(url);
})

app.get('/redirect',(req,res) => {
    const code = req.query.code;
    oauth2Client.getToken(code,(err,tokens)=>{
        if(err){
            console.error("Couldn't get token",err);
            res.send('Error')
            return
        }
         oauth2Client.setCredentials(tokens);
         res.send("Successfully logged in");
    })
});

app.get('/calendars',(req,res) => {
    const calendar = google.calendar({version:"v3", auth:oauth2Client});
    calendar.calendarList.list({},(err,response) => {
        if(err){
            console.error('error fetching calendars', err);
            res.send('Error!');
            return
        }
        const calendars = response.data.items;
        res.json(calendars);
    })

});

app.get('/events', (req,res) => {
    const calendarId = req.query.calendar??'primary'
    const calendar = google.calendar({version:"v3", auth:oauth2Client});
    calendar.events.list({
        calendarId,
        timeMin:(new Date()).toISOString(),
        maxResults: 15,
        singleEvents:true,
        orderBy:'startTime'
    },(err,response)=>{
        if(err){
            console.error("Can't fetch events",err);
            res.send("Error");
            return
        }
        const events = response.data.items;
        res.json(events);
    })
})

app.get('/calendarlist', (req,res) => {
    const calendarlist = google.calendarList()
    return;
})

app.post('/create-event', (req, res) => {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarId = 'primary';
    // console.log(req.body.eventData);
    // const eventData = req.body.eventData; // Assuming you're sending event data from the frontend

    // Basic event structure
    const event = {
        summary: req.body.summary,
        description: req.body.description,
        start: {
            dateTime: getTodayAt9PM().toISOString(),
            timeZone: 'America/Los_Angeles', // Adjust the timezone as needed
        },
        end: {
            dateTime: (new Date(getTodayAt9PM().getTime() + 1 * 60 * 60 * 1000)).toISOString(), // 1-hour duration
            timeZone: 'America/Los_Angeles', 
        }, 
    };

    calendar.events.insert({
        calendarId,
        resource: event,
    }, (err, event) => {
        if (err) {
            console.error("Calendar event creation error:", err);
            res.status(500).send('Error creating event');
            return;
        }
        res.json(event.data);
    });
});

function getTodayAt9PM() {
    const now = new Date();
    now.setHours(21, 0, 0, 0); // 9 PM
    return now;
}

app.listen(3000,()=>console.log('Server running at 3000'));