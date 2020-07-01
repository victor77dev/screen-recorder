let mediaRecorder, mixRecorder, screenRecorder, cameraRecorder, cameraStream;
let shareStream;
let startTime, now;
let muted = false;

window.onload = () => {
    console.log('loaded')
    const start = document.querySelector('#start');
    start.onclick = (event) => {
        startTime = Date.now();
        shareStream = new MediaStream();
        startAudioRecord();
        startScreenRecord();
    }

    const stop = document.querySelector('#stop');
    stop.onclick = (event) => {
        mediaRecorder.stop();
        // mixRecorder.stop();
        cameraRecorder.stop();
        // screenRecorder.stop();
    }

    const mute = document.querySelector('#mute');
    mute.onclick = (event) => {
        muted = !muted;
        cameraStream.getAudioTracks()[0].applyConstraints(muted ? {audio: false} : constraints);
        mute.innerHTML = muted ? 'unmute' : 'mute';
    }
}

function download(name, chunks, duration) {
    var blob = new Blob(chunks, {
        type: "video/webm"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = `${name}.webm?t=,${duration / 1000}`;
    a.click();
    window.URL.revokeObjectURL(url);
}


function startAudioRecord() {
    const constraints = {
        audio: {
            sampleSize: 16,
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
        },
        // video: {
        //     width: { min: 1024, ideal: 1280, max: 1920 },
        //     height: { min: 576, ideal: 720, max: 1080 },
        // }
    }
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            /* use the stream */
            // const video = document.querySelector('#camera');
            // video.srcObject = stream;
            // video.onloadedmetadata = function(e) {
            //     video.play();
            // };
            cameraStream = stream;
            // shareStream.addTrack(stream.getAudioTracks()[0]);
            var cameraChunks = [];
            var options = { mimeType: "video/webm; codecs=vp9" };
            cameraRecorder = new MediaRecorder(stream, options);

            setInterval(() => {
                cameraRecorder.requestData();
            }, 1800 * 1000);

            // cameraRecorder.ondataavailable = cameraData;
            // cameraRecorder.start();
            // function cameraData(event) {
            //     if (event.data.size > 0) {
            //         console.log('downloading')
            //         const duration = now - startTime;
            //         cameraChunks.push(event.data);
            //         download('camera', cameraChunks, duration);
            //     } else {
            //         // ...
            //     }
            // }
        })
        .catch(function(err) {
            /* handle the error */
        });
}

function startScreenRecord() {
    var displayMediaOptions = {
        video: {
            // width: { min: 1024, ideal: 1280, max: 1920 },
            // height: { min: 576, ideal: 720, max: 1080 },
            width: { ideal: 1024 },
            height: { ideal: 576 },
        },
        // video: true,
        audio: true,
    };

    navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
    .then((stream) => {
        shareStream.addTrack(stream.getVideoTracks()[0])
        shareStream.addTrack(stream.getAudioTracks()[0])
        cameraStream.getAudioTracks()[0]

        const video = document.querySelector('#screen');
        video.srcObject = shareStream;
        video.onloadedmetadata = function(e) {
            video.play();
        };

        var mixChunks = [];
        var options = { mimeType: "video/webm; codecs=vp9" };
        mixRecorder = new MediaRecorder(shareStream, options);


        setInterval(() => {
            mixRecorder.requestData();
        }, 60000);

        var audioCtx = new AudioContext();
        // var source = audioCtx.createMediaStreamSource(cameraStream);
        var shareCameraSource = audioCtx.createMediaStreamSource(cameraStream);
        var source = audioCtx.createMediaStreamSource(shareStream);
        var dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        shareCameraSource.connect(dest);
        mediaRecorder = new MediaRecorder(dest.stream, options);

        setInterval(() => {
            console.log('request media recorder')
            mediaRecorder.requestData();
        }, 6000);
        mediaRecorder.ondataavailable = mixData;
        mediaRecorder.start();

        // mixRecorder.ondataavailable = mixData;
        // mixRecorder.start();

        function mixData(event) {
            console.log('this is mix data', event)
            if (event.data.size > 0) {
                now = Date.now();
                const duration = now - startTime;
                startTime = now;
                mixChunks.push(event.data);
                download('mix', mixChunks, duration);
            } else {
                // ...
            }
        }

        // var screenChunks = [];
        // var options = { mimeType: "video/webm; codecs=vp9" };
        // screenRecorder = new MediaRecorder(stream, options);

        // screenRecorder.ondataavailable = screenData;
        // screenRecorder.start();
        // function screenData(event) {
        //     if (event.data.size > 0) {
        //         screenChunks.push(event.data);
        //         download('screen', screenChunks);
        //     } else {
        //         // ...
        //     }
        // }

        // var cameraChunks = [];
        // var options = { mimeType: "video/webm; codecs=vp9" };
        // cameraRecorder = new MediaRecorder(cameraStream, options);

        // cameraRecorder.ondataavailable = cameraData;
        // cameraRecorder.start();
        // function cameraData(event) {
        //     if (event.data.size > 0) {
        //         cameraChunks.push(event.data);
        //         download('camera', cameraChunks);
        //     } else {
        //         // ...
        //     }
        // }

    })
    .catch(err => { console.error("Error:" + err); return null; });

}


