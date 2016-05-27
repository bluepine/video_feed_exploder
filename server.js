// // reference the http module so we can create a webserver
// var http = require("http");

// // create a server
// http.createServer(function(req, res) {
//     // on every request, we'll output 'Hello world'
//     res.end("Hello world from Cloud9!");
// }).listen(process.env.PORT, process.env.IP);

// // Note: when spawning a server on Cloud9 IDE,
// // listen on the process.env.PORT and process.env.IP environment variables

// // Click the 'Run' button at the top to start your server,
// // then click the URL that is emitted to the Output tab of the console
const VIDEO_SCALE = 2
const COLLECTION_SCALE = 1

var _ = require('lodash');

var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({
    port: process.env.PORT,
    host: process.env.IP
});
var Wreck = require('wreck');
const url = "http://api.platform.cnn.com/api/v1.5/clips/curated/appletv/20";
server.route({
    method: 'GET',
    path: '/',
    handler: function(request, reply) {
        Wreck.get(url, function(err, res, payload) {
            const headers = ['cache-control', 'content-type'];

            if (err) {
                console.log(err);
                reply.continue;
                return
            }
            var res_str = payload.toString();
            var obj = JSON.parse(res_str);
            if (obj) {
                obj = manipulate_google_video_feed(obj);
                res_str = JSON.stringify(obj);
            }
            var response = reply(res_str).hold();
            for (var i in headers) {
                var h = headers[i]
                if (res.headers[h]) {
                    response.header(h, res.headers[h]);
                }
            }
            // console.log(response.headers);
            response.send();
        });
    }
});

server.start(function() {
    console.log('Server running at:', server.info.uri);
});


function more_videos(obj) {
    obj = _.map(obj, function(list) {
        // console.log(list.category)
        var rrr = _.flatMap(list.videos, function(video) {
            // console.log(video.title)
            var video_string = JSON.stringify(video);
            var rr = _.map(_.range(VIDEO_SCALE), function(index) {
                    var r = JSON.parse(video_string);
                    r.title += list.collectionName;
                    r.title += index;
                    return r
                })
                //   console.log(rr);
            return rr;
        });
        //   console.log(rrr);
        list.videos = rrr;
        return list;
    });
    return obj;
}

function more_collections(obj) {
    obj = _.flatMap(obj, function(list) {
        // console.log(list.category)
        var list_string = JSON.stringify(list);
        var rr = _.map(_.range(COLLECTION_SCALE), function(index) {
                var r = JSON.parse(list_string);
                r.collectionName += index
                return r
            })
            //   console.log(rr);
        return rr;
    });
    return obj;
}

function manipulate_google_video_feed(obj) {
    // console.log(obj)
    return more_videos(more_collections(obj));
}
