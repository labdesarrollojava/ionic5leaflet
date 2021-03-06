import {
  Component,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import * as L from "leaflet";
import "leaflet-rotatedmarker";

import { CameraPreview } from "@ionic-native/camera-preview/ngx";
import { Geolocation } from "@ionic-native/geolocation/ngx";
import {
  DeviceOrientation,
  DeviceOrientationCompassHeading,
} from "@ionic-native/device-orientation/ngx";

import * as common from "../../common";
import { TargetService } from "../../services/target.service";
import { GeolocService } from 'src/app/services/geoloc.service';

@Component({
  selector: "app-camview",
  templateUrl: "./camview.component.html",
  styleUrls: ["./camview.component.scss"],
})
export class CamviewComponent implements AfterViewInit {
  @Input() iTarget = 0;
  @Output() closeCamview: EventEmitter<any> = new EventEmitter();
  r6 = common.r6;
  
  constructor(
    private geolocService: GeolocService,
    private targetService: TargetService,
    private cameraPreview: CameraPreview,
    private geolocation: Geolocation,
    private deviceOrientation: DeviceOrientation
  ) {}

  ngAfterViewInit() {
    this.startAll();
  }

  isCameraOn: boolean = false;

  ionViewWillLeave() {
    this.endAll();
  }

  async startAll() {
    try {
      this.startCamera();
      this.startGeolocation();
      this.startHeading();
      this.startAngle();
      this.startSmallMap();
    } catch (err) {
      console.log(err);
    }
  }

  async endAll() {
    try {
      this.isCameraOn = false;
      await this.cameraPreview.stopCamera();
      await this.processHeading.unsubscribe();
      await clearInterval(this.processGeo);
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
    this.targetService.addOrigin(this.iTarget, {
      photoUrl: "data:image/jpeg;base64," + imageData,
      timestamp: new Date().toLocaleString(),
      latitude: this.latitude,
      longitude: this.longitude,
      heading: this.heading,
      elevation: this.elevation,
    });

    await this.endAll();
    this.closeCamview.emit();
  }

  isGeoLoaded = false;
  latitude = 0;
  longitude = 0;
  processGeo = null;
  startGeolocation() {
    this.processGeo = setInterval(() => {
      this.isGeoLoaded = this.geolocService.isGeoLoaded;
      this.latitude = this.geolocService.latitude;
      this.longitude = this.geolocService.longitude;

      try {
        this.marker.setLatLng([this.latitude, this.longitude]);
      } catch (err) {
        console.log(err);
      }
    }, 200);
  }

  heading = 0;
  processHeading = null;

  startHeading() {
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
        try {
          this.marker.setRotationAngle(this.heading);
        } catch (err) {
          console.log(err);
        }
      });
  }

  alpha = 0;
  beta = 0;
  gamma = 0;
  elevation = 0;
  startAngle() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener(
        "deviceorientation",
        (event) => {
          // alpha: rotation around z-axis
          this.alpha = event.alpha;
          // beta: front back motion
          this.beta = event.beta;
          // gamma: left to right
          this.gamma = event.gamma;

          let pitch = common.deg2rad(this.beta);
          let roll = common.deg2rad(this.gamma);
          let yaw = common.deg2rad(this.alpha);

          this.elevation = common.rad2deg(common.elevation(pitch, roll, yaw));
        },
        true
      );
    }
  }

  map = null;
  marker = null;
  startSmallMap() {
    setTimeout(() => {
      this.map = L.map("map", {
        center: [this.latitude, this.longitude],
        zoom: 17,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.map);

      let blueIcon = L.icon({
        iconUrl: "assets/marker_direction.png",
        iconSize: [30, 1080], // size of the icon
        iconAnchor: [15, 1065], // point of the icon which will correspond to marker's location
        popupAnchor: [-3, -15], // point from which the popup should open relative to the iconAnchor
      });

      this.marker = L.marker([this.latitude, this.longitude], {
        title: "Origin",
        icon: blueIcon,
        alt: "+",
        draggable: false,
        rotationAngle: this.heading,
      }).addTo(this.map);
    }, 1000);
  }
}


