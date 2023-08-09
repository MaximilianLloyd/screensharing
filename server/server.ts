import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';


const app = express();

app.use(cors());
app.use(express.static('./dist'))
// app.use(bodyParser.json({
//     type: 'application/octet-stream',
//     limit: '100mb'
// }))
const octetStreamParser = bodyParser.raw({
  inflate: false,
  type: "application/octet-stream",
  limit: "200mb",
});

app.use(bodyParser.json({limit: '100mb'}));
app.use(octetStreamParser);

app.get('/', (req, res) => {
    res.send('Hello World!');

    }
);

app.get('/api', (req, res) => {

}
);

https://developer.chrome.com/articles/webcodecs/
app.post('/stream', (req, res) => {
    console.log('STREAM!')
    const bufferString = Buffer.from(req.body.buffer).toString();
    console.log('bufferString', req.body.buffer)
})

console.log('Server running on port 3000');

app.listen(3000)

