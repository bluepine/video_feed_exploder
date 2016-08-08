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
const VIDEO_SCALE = 3
const COLLECTION_SCALE = 3

//please set those values according to the config file the app is using
const paths = {
  clipsCategories: "/api/v1.5/clips/categories/appletv",
  clipsForCategory: "/api/v1.5/clips/category/appletv/{blabla}",
  clipsCollections: "/api/v1.5/clips/curated/appletv/{num}",
  m3u8Lookup: "/api/v1.5/video/item/appletv/{blabla}",
  search: "/api/v1.5/search/appletv/{blabla}"
}

const host = "api.platform.cnn.com"



const _ = require('lodash');

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({
    port: process.env.PORT,
    host: process.env.IP
});

const pathThroughHandler = {
  proxy: {
    host: host,
    port: 80,
    protocol: 'http',
    passThrough: true,
    xforward: true
  }
}

const Wreck = require('wreck');
const h2o2 = require('h2o2')

server.register({
    register: require('h2o2')
}, function (err) {

    if (err) {
        console.log('Failed to load h2o2');
    }

    server.start(function (err) {
        console.log('Server started at: ' + server.info.uri);
    });
});

server.route(
  {
    method: 'GET',
    path: paths.clipsCategories,
    handler:pathThroughHandler
  }
);
server.route(
  {
    method: 'GET',
    path: paths.m3u8Lookup,
    handler:pathThroughHandler
  }
);
server.route(
  {
    method: 'GET',
    path: paths.search,
    handler:pathThroughHandler
  }
);
server.route(
  {
    method: 'GET',
    path: paths.clipsForCategory,
    handler:pathThroughHandler
  }
);
server.route(
  {
    method: 'GET',
    path: paths.clipsCollections,
    handler: function(request, reply) {
        var url = request.connection.info.protocol + '://' + host + request.url.path;
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
