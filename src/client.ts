function log() {

    console.log('Hello World!');
}

async function startCapture(displayMediaOptions: DisplayMediaStreamOptions) {
    let captureStream = null;
    let recorder = null;

    try {
        captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        recorder = new MediaRecorder(captureStream, {
            // mimeType: 'video/webm; codecs=vp9',
            mimeType: 'video/webm; codecs=vp8',
        });
    } catch (err) {
        console.error(`Error: ${err}`);
    }

    if (!captureStream || !recorder) {
        throw new Error('Could not start capture');
    }

    return {
        captureStream,
        recorder,
    };
}

const opts = {
    video: {
        displaySurface: 'browser',
    },
    selfBrowserSurface: "include"
}

startCapture(opts as any).then(async ({ captureStream, recorder }) => {
    const track = captureStream.getVideoTracks()[0]

    // Get contents

    console.log('mime/types', recorder.mimeType)
    // Listen for cursor

    recorder.start(16)

    // const chunks: EncodedVideoChunk[] = []

    const encoder = new VideoEncoder({
        output: (chunk, metadata) => {
            // chunks.push(chunk)
            // console.log('chunk', chunk)
            console.log('here', metadata.decoderConfig)
            const chunkData = new Uint8Array(chunk.byteLength)

            fetch('http://localhost:3000/stream', {
                method: 'POST',
                body: chunkData,
                headers: {
                    'Content-Type': 'application/octet-stream'
                }
            }
            )


            setTimeout(() => {
                decoder.decode(chunk)
            }, 100)
        },
        error: (error) => {
            console.log('error', error)
        },
    })

    const width = document.body.clientWidth;
    const height = document.body.clientHeight;

    encoder.configure({
        codec: 'vp8',
        width: width,
        height: height,
        framerate: 30,
        bitrate: 1000000,
    })

    const trackProcessor = new MediaStreamTrackProcessor({
        track
    })

    const reader = trackProcessor.readable.getReader();


    // recorder.addEventListener('dataavailable', async (e) => {
    //     console.log('dataavailable', e.data)
    //     // const blob = await e.data.arrayBuffer()
    //     chunks.push({
    //         timestamp: e.timeStamp,
    //         type: 'key',
    //         data: await e.data.arrayBuffer(),
    //     })
    //
    // })

    let frameCounter = 0;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    let pendingFrames: VideoFrame[] = [];

    let underflow = true;
    let baseTime = 0;

    function handleFrame(frame: VideoFrame) {
        pendingFrames.push(frame);
        if (underflow) setTimeout(renderFrame, 0);
    }

    async function renderFrame() {
        underflow = pendingFrames.length == 0;
        if (underflow) return;

        const frame = pendingFrames.shift();


        if (frame) {


            // Based on the frame's timestamp calculate how much of real time waiting
            // is needed before showing the next frame.
            const timeUntilNextFrame = calculateTimeUntilNextFrame(frame.timestamp);
            await new Promise((r) => {
                setTimeout(r, timeUntilNextFrame);
            });

            ctx?.drawImage(frame, 0, 0);
            frame.close();
        }

        // Immediately schedule rendering of the next frame
        setTimeout(renderFrame, 0);
    }




    function calculateTimeUntilNextFrame(timestamp: number) {
        if (baseTime == 0) baseTime = performance.now();
        let mediaTime = performance.now() - baseTime;
        return Math.max(0, timestamp / 1000 - mediaTime);
    }


    const decoder = new VideoDecoder({
        output: (frame) => {
            console.log('frame', frame)
            handleFrame(frame)
        },
        error: (error) => {
            console.log('error', error)
        },
    })

    decoder.configure({
        // codec: 'vp9',
        codec: 'vp8',
        // description: chunks[0].data,
        codedHeight: height,
        codedWidth: width,
        // description: await chunks[0].arrayBuffer(),
    })




    while (true) {
        const result = await reader.read();
        if (result.done) {
            continue;
        };

        const frame = result.value;

        if (encoder.encodeQueueSize > 2) {
            // Too many frames in flight, encoder is overwhelmed
            // let's drop this frame.
            frame.close();
        } else {
            frameCounter++;
            const keyFrame = frameCounter % 150 == 0;
            encoder.encode(frame, { keyFrame });
            frame.close();
        }
    }




});

console.log('Hello')
console.log('Another hello')
