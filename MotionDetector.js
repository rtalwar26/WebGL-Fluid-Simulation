/*********************************************************************
*  #### JS Motion Visualiser ####
*  Coded by Jason Mayes. www.jasonmayes.com
*  Please keep this disclaimer with my code if you use it anywhere. 
*  Thanks. :-)
*  Got feedback or questions, ask here:
*  Github: https://github.com/jasonmayes/JS-Motion-Detection/
*  Updates will be posted to this site.
*********************************************************************/
const video_width = 100;
const video_height = 100;
// Cross browser support to fetch the correct getUserMedia object.
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
  || navigator.mozGetUserMedia || navigator.msGetUserMedia;

// Cross browser support for window.URL.
window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;


var MotionDetector = (function () {
  var alpha = 0.5;
  var version = 0;
  var greyScale = true;
  var motion_sensitivity = 5;
  let max_points = 2;
  var touch_identifier = Date.now();
  var message = document.getElementById('message');
  var canvas_motion = document.getElementById('motion');
  var canvasFinal = document.getElementById('canvasFinal');
  var video = document.getElementById('camStream');
  var ctx = canvas_motion.getContext('2d');
  var ctxFinal = canvasFinal.getContext('2d');
  var localStream = null;
  var imgData = null;
  var imgDataPrev = [];
  var touch_state = 0;

  function success(stream) {
    localStream = stream;
    // Create a new object URL to use as the video's source.
    video.srcObject = stream
    video.play();
  }


  function handleError(error) {
    console.error(error);
  }


  function snapshot() {
    if (localStream) {
      canvas_motion.width = video.offsetWidth;
      canvas_motion.height = video.offsetHeight;
      canvasFinal.width = video.offsetWidth;
      canvasFinal.height = video.offsetHeight;

      ctx.drawImage(video, 0, 0);

      // Must capture image data in new instance as it is a live reference.
      // Use alternative live referneces to prevent messed up data.
      imgDataPrev[version] = ctx.getImageData(0, 0, canvas_motion.width, canvas_motion.height);
      version = (version == 0) ? 1 : 0;
      let pixelChanges = [];
      let change_distribution = {};
      imgData = ctx.getImageData(0, 0, canvas_motion.width, canvas_motion.height);
      // message.innerHTML = `${pixel.x},${pixel.y}`;

      var length = imgData.data.length;

      var x = 0;
      while (x < length) {
        if (!greyScale) {
          // Alpha blending formula: out = (alpha * new) + (1 - alpha) * old.
          // imgData.data[x] = alpha * (255 - imgData.data[x]) + ((1 - alpha) * imgDataPrev[version].data[x]);
          // imgData.data[x + 1] = alpha * (255 - imgData.data[x + 1]) + ((1 - alpha) * imgDataPrev[version].data[x + 1]);
          // imgData.data[x + 2] = alpha * (255 - imgData.data[x + 2]) + ((1 - alpha) * imgDataPrev[version].data[x + 2]);
          // imgData.data[x + 3] = 255;
        } else if (imgDataPrev[version]) {
          // GreyScale.
          var av = (imgData.data[x] + imgData.data[x + 1] + imgData.data[x + 2]) / 3;
          var av2 = (imgDataPrev[version].data[x] + imgDataPrev[version].data[x + 1] + imgDataPrev[version].data[x + 2]) / 3;
          let difference = ((imgData.data[x] + imgData.data[x + 1] + imgData.data[x + 2]) / 3) - ((imgDataPrev[version].data[x] + imgDataPrev[version].data[x + 1] + imgDataPrev[version].data[x + 2]) / 3);
          // message.innerHTML = `${difference}`
          // difference && console.log({ av, av2, diff: av - av2 });
          var blended = alpha * (255 - av) + ((1 - alpha) * av2);
          // let difference = Math.abs(imgData.data[x] - blended);
          imgData.data[x] = blended;

          imgData.data[x + 1] = blended;
          imgData.data[x + 2] = blended;
          imgData.data[x + 3] = 255;

          difference = Math.abs(Math.floor(difference));

          let key = difference;


          let diff = change_distribution[key] ? change_distribution[key] : 0;
          change_distribution[key] = diff + 1;

          if (difference > motion_sensitivity) {
            let pixel = { pageX: 0, pageX: 0, identifier: touch_identifier };
            pixel.pageX = canvas_motion.width - (Math.floor((x / 4)) % canvas_motion.width);
            pixel.pageY = Math.floor((x / 4) / canvas_motion.width);

            pixelChanges.push(pixel);

          }
        }
        x += 4;
      }
      // ctxFinal.putImageData(imgData, 0, 0);
      let change_factor = (pixelChanges.length) * 100 / (length * 0.25);
      // console.log('change factor', change_factor);

      if (change_factor > 5) {
        let gap = Math.floor(pixelChanges.length / max_points);

        let new_points = [];
        let x = 0;
        while (x < pixelChanges.length) {
          new_points.push({ ...pixelChanges[x] });
          x = x + gap;
        }
        // console.log({ change_distribution });
        // message.dispatchEvent(new CustomEvent('motion_down', { detail: pixelChanges[0] }))
        message.dispatchEvent(new CustomEvent('motion_moved', { detail: new_points }));
        // message.dispatchEvent(new CustomEvent('motion_up', { detail: pixelChanges[pixelChanges.length - 1] }))
      } else {
        touch_identifier = Date.now();
        // message.dispatchEvent(new CustomEvent('motion_ended', { detail: pixelChanges }))

      }
      // (pixelChanges.length > (canvas_motion.width * canvas_motion.height) * 0.6);
      // message.dispatchEvent(new CustomEvent('motion_detected', { detail: pixelChanges }));
    }
  }


  function init_(width, height) {
    if (navigator.getUserMedia) {
      navigator.getUserMedia({
        video: {
          width: width || 1024,
          height: height || 756
        }
      }, success, handleError);


    } else {
      console.error('Your browser does not support getUserMedia');
    }
    window.setInterval(snapshot, 40);
  }

  return {
    init: init_
  };
})();

MotionDetector.init(video_width, video_height);
