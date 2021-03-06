import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
} from "@angular/core";
import * as L from "leaflet";
import "leaflet-rotatedmarker";
import { TargetService } from "src/app/services/target.service";
import * as common from '../../common';

@Component({
  selector: "app-editmap",
  templateUrl: "./editmap.component.html",
  styleUrls: ["./editmap.component.scss"],
})
export class EditmapComponent implements AfterViewInit {
  r6 = common.r6;
  @Input() iTarget = 0;
  @Input() iOrigin = 0;
  @Output() doClose: EventEmitter<any> = new EventEmitter();
  map;
  target;
  origin;

  constructor(private targetService: TargetService) {}

  ngAfterViewInit(): void {
    this.target = this.targetService.arrTarget[this.iTarget];
    this.origin = this.target.arrOrigin[this.iOrigin];
    this.initMap();
  }

  onClickClose() {
    this.doClose.emit();
  }

  initMap() {
    this.map = L.map("map", {
      center: [this.origin.latitude, this.origin.longitude],
      zoom: 17,
      attributionControl: false
    });

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    tiles.addTo(this.map);

    let blueIcon = L.icon({
      iconUrl: "assets/marker_direction.png",
      iconSize: [30, 1080], // size of the icon
      iconAnchor: [15, 1065], // point of the icon which will correspond to marker's location
      popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
    });

    let myMarker = L.marker([this.origin.latitude, this.origin.longitude], {
      title: "Origin",
      icon: blueIcon,
      alt: "+",
      draggable: true,
      rotationAngle: this.origin.heading,
    })
      .addTo(this.map)
      .on("dragend", () => {
        let { lat, lng } = myMarker.getLatLng();
        myMarker.bindTooltip(`[${this.r6(lat)}, ${this.r6(lng)}]`).openTooltip();
        this.moveOrigin(lat, lng);
      });

    let { lat, lng } = myMarker.getLatLng();
    myMarker
      .bindTooltip("Drag to change location.<br/>" + `[${this.r6(lat)}, ${this.r6(lng)}]`, {
        opacity: 0.8,
        direction: "bottom",
        offset: L.point(0, 50),
        sticky: false,
      })
      .openTooltip();
    // myMarker.setRotationAngle(newAngle);
  }

  moveOrigin(lat, lng) {
    this.targetService.moveOrigin(this.iTarget, this.iOrigin, lat, lng);
  }
}
