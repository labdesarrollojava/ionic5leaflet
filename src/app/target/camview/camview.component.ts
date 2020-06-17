import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { CameraPreview } from "@ionic-native/camera-preview/ngx";
import { Geolocation } from "@ionic-native/geolocation/ngx";
import {
  DeviceOrientation,
  DeviceOrientationCompassHeading,
} from "@ionic-native/device-orientation/ngx";

import { TargetService } from "../../services/target.service";


@Component({
  selector: "app-camview",
  templateUrl: "./camview.component.html",
  styleUrls: ["./camview.component.scss"],
})
export class CamviewComponent implements OnInit {
  @Input() iTarget = 0;
  @Output() closeCamview: EventEmitter<any> = new EventEmitter();

  constructor(
    private targetService: TargetService,
    private cameraPreview: CameraPreview,
    private geolocation: Geolocation,
    private deviceOrientation: DeviceOrientation
  ) {}

  ngOnInit() {
    this.startAll();
  }

  isCameraOn: boolean = false;

  ionViewWillLeave() {
    console.log("ionViewWillLeave");
    this.endAll();
  }

  async startAll() {
    try {
      this.startCamera();
      this.startGeolocation();
      this.startDeviceOrientationLooking();
    } catch (err) {
      console.log(err);
    }
  }

  async endAll() {
    try {
      this.isCameraOn = false;
      await this.cameraPreview.stopCamera();
      await this.processGeo.unsubscribe();
      await this.processHeading.unsubscribe();
    } catch (err) {
      console.log(err);
    }
  }

  async onClickCancel() {
    await this.endAll();
    this.closeCamview.emit();
  }

  async startCamera() {
    this.isCameraOn = false;
    // await this.cameraPreview.stopCamera();
    await this.cameraPreview.startCamera({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      camera: "rear",
      tapPhoto: true,
      previewDrag: false,
      toBack: true,
    });
    this.isCameraOn = true;
  }

  zoomRatio = 1;
  changeZoom() {
    this.cameraPreview.setZoom(this.zoomRatio);
  }

  takePicture() {
    this.cameraPreview
      .takePicture({
        width: window.innerWidth,
        height: window.innerHeight,
        quality: 85,
      })
      .then(
        (imageData) => {
          this.confirmResult(imageData);
        },
        (err) => {
          console.log(err);
          this.closeCamview.emit();
        }
      );
  }

  async confirmResult(imageData) {
    await this.endAll();
    let title = window.prompt("Origin Title:", "");
    if (title === null || title === "") {
    } else {
      this.targetService.addOrigin(this.iTarget, {
        title: title,
        photoUrl: "data:image/jpeg;base64," + imageData,
        timestamp: new Date().toLocaleString(),
        latitude: this.latitude,
        longitude: this.longitude,
        heading: this.heading,
      }); 
    }
    this.closeCamview.emit();
  }

  latitude = 0;
  longitude = 0;
  processGeo = null;
  startGeolocation() {
    this.geolocation
      .getCurrentPosition()
      .then((resp) => {
        this.latitude = resp.coords.latitude;
        this.longitude = resp.coords.longitude;
      })
      .catch((error) => {
        console.log("Error getting location", error);
      });

    this.processGeo = this.geolocation.watchPosition();
    this.processGeo.subscribe((data) => {
      // data can be a set of coordinates, or an error (if an error occurred).
      this.latitude = data.coords.latitude;
      this.longitude = data.coords.longitude;
    });
  }

  heading = 0;
  processHeading = null;
  startDeviceOrientationLooking() {
    // Get the device current compass heading
    this.deviceOrientation.getCurrentHeading().then(
      (data: DeviceOrientationCompassHeading) => {
        // this.heading = data.magneticHeading;
        this.heading = data.trueHeading;
      },
      (error: any) => console.log(error)
    );

    // Watch the device compass heading change
    this.processHeading = this.deviceOrientation
      .watchHeading()
      .subscribe((data) => {
        // this.heading = data.magneticHeading;
        this.heading = data.trueHeading;
      });

    // if (window.DeviceOrientationEvent) {
    //   window.addEventListener("deviceorientation", (event) => {
    //     // alpha: rotation around z-axis
    //     this.alpha = event.alpha;
    //     // beta: front back motion
    //     this.beta = event.beta;
    //     // gamma: left to right
    //     this.gamma =event.gamma;
    //   }, true);
    // }

    // window.addEventListener(
    //   "compassneedscalibration",
    //   function (event) {
    //     alert(
    //       "Your compass needs calibrating! Wave your device in a figure-eight motion"
    //     );
    //     event.preventDefault();
    //   },
    //   true
    // );
  }

  // calibrate() {
  //   window.dispatchEvent(new Event("compassneedscalibration"));
  // }
}


const r3 = (n) => {
  return Math.round(n * 1000) / 1000;
};