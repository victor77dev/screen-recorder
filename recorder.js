let mixRecorder, audioStream, screenStream, mixStream;
let startTime, now;
let muted = false;

window.onload = () => {
    const start = document.querySelector('#start');
    start.onclick = startCapture.bind(this);

    const stop = document.querySelector('#stop');
    stop.onclick = stopCapture.bind(this);

    const mute = document.querySelector('#mute');
    mute.onclick = () => {
        muted = !muted;
        mute.innerHTML = muted ? 'unmute' : 'mute';
    }
}

function startCapture() {
    console.log('start Capture')
    startTime = Date.now();
    startAudioRecord();
    startScreenRecord();
}

function stopCapture() {
    console.log('stop Capture')
    mixRecorder.stop();
    screenStream.getTracks().forEach((track) => {
        track.stop();
    });
    audioStream.getTracks().forEach((track) => {
        track.stop();
    });
}

function download(name, chunks, duration) {
    const blob = new Blob(chunks, {
        type: "video/webm"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
    }
    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            audioStream = stream;
        })
        .catch((err) => {
            console.error(err);
        });
}

function startScreenRecord() {
    const options = {
        video: {
            width: {ideal: 1280},
            height: {ideal: 720},
        },
        audio: true,
    };

    navigator.mediaDevices.getDisplayMedia(options)
    .then((stream) => {
        screenStream = stream;
        const mixChunks = [];
        const options = {mimeType: 'video/webm; codecs=vp9'};

        setInterval(() => {
            console.log('request mix recorder')
            mixRecorder.requestData();
        }, 1800000);

        const audioCtx = new AudioContext();
        const audioSource = audioCtx.createMediaStreamSource(audioStream);
        const screenSource = audioCtx.createMediaStreamSource(stream);
        const dest = audioCtx.createMediaStreamDestination();

        screenSource.connect(dest);
        audioSource.connect(dest);

        mixStream = new MediaStream();
        mixStream.addTrack(stream.getVideoTracks()[0]);
        mixStream.addTrack(dest.stream.getAudioTracks()[0]);
        mixRecorder = new MediaRecorder(mixStream, options);

        mixRecorder.ondataavailable = mixData;
        mixRecorder.start();

        const video = document.querySelector('#screen');
        video.srcObject = mixStream;
        video.onloadedmetadata = function(e) {
            video.play();
        };

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
    })
    .catch(err => { console.error("Error:" + err); return null; });

}


