// Swansea Darwin Live Rail Board backend
// Node.js 18+
// Install: npm install express xml2js dotenv
//
// Create a .env file:
// DARWIN_TOKEN=YOUR_NATIONAL_RAIL_DARWIN_TOKEN
//
// Run:
// node server.js
//
// The browser never receives the Darwin token.

const express = require("express");
const xml2js = require("xml2js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.DARWIN_TOKEN;

app.use(express.static("."));

const DARWIN_URL =
  "https://lite.realtime.nationalrail.co.uk/OpenLDBWS/ldb9.asmx";

function soapEnvelope(type) {
  const action = type === "arrivals"
    ? "GetArrivalBoardRequest"
    : "GetDepartureBoardRequest";

  const request = type === "arrivals"
    ? `<ldb:GetArrivalBoardRequest>
         <ldb:numRows>20</ldb:numRows>
         <ldb:crs>SWA</ldb:crs>
         <ldb:filterCrs></ldb:filterCrs>
         <ldb:filterType>to</ldb:filterType>
         <ldb:timeOffset>0</ldb:timeOffset>
         <ldb:timeWindow>120</ldb:timeWindow>
       </ldb:GetArrivalBoardRequest>`
    : `<ldb:GetDepartureBoardRequest>
         <ldb:numRows>20</ldb:numRows>
         <ldb:crs>SWA</ldb:crs>
         <ldb:timeOffset>0</ldb:timeOffset>
         <ldb:timeWindow>120</ldb:timeWindow>
       </ldb:GetDepartureBoardRequest>`;

  return `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
    xmlns:typ="http://thalesgroup.com/RTTI/2013-11-28/Token/types"
    xmlns:ldb="http://thalesgroup.com/RTTI/2016-02-16/ldb/">
    <soap:Header>
      <typ:AccessToken>
        <typ:TokenValue>${TOKEN}</typ:TokenValue>
      </typ:AccessToken>
    </soap:Header>
    <soap:Body>${request}</soap:Body>
  </soap:Envelope>`;
}

function first(v){
  if (Array.isArray(v)) return v[0];
  return v;
}

function text(v){
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === "object" && "_" in v) return String(v._);
  return String(v);
}

function parseServices(parsed, type){
  // Darwin XML structures can vary slightly between versions.
  // This parser intentionally checks several common locations.
  const body = parsed?.["soap:Envelope"]?.["soap:Body"] ||
               parsed?.["soapenv:Envelope"]?.["soapenv:Body"] ||
               parsed?.Envelope?.Body || {};

  const resultKey = Object.keys(body).find(k =>
    /Get(Departure|Arrival)BoardResponse/i.test(k)
  );
  if (!resultKey) return [];

  const result = first(body[resultKey]);
  const boardKey = Object.keys(result || {}).find(k =>
    /GetBoardResult|GetBoard/i.test(k)
  );
  const board = first((result && boardKey) ? result[boardKey] : result);

  const services = board?.trainServices?.service ||
                   board?.service ||
                   board?.trainServices ||
                   [];

  return (Array.isArray(services) ? services : [services]).filter(Boolean).map(s=>{
    const std = first(s.std);
    const sta = first(s.sta);
    const etd = first(s.etd);
    const eta = first(s.eta);
    const platform = text(first(s.platform));
    const operator = text(first(s.operator)) || text(first(s.toc));
    const destinationObj = first(s.destination);
    const originObj = first(s.origin);

    let destination = "";
    let origin = "";

    if (destinationObj?.location) {
      const loc = destinationObj.location;
      destination = text(first(loc));
    } else destination = text(destinationObj);

    if (originObj?.location) {
      origin = text(first(originObj.location));
    } else origin = text(originObj);

    const scheduled = type === "arrivals" ? text(sta) : text(std);
    const actual = type === "arrivals" ? text(eta) : text(etd);

    let status = "On time";
    let statusClass = "on";

    if (/cancel/i.test(actual)) {
      status = "Cancelled";
      statusClass = "cancelled";
    } else if (/due/i.test(actual)) {
      status = "Due";
      statusClass = "due";
    } else if (actual && actual !== scheduled) {
      status = actual;
      statusClass = "late";
    }

    return {
      time: scheduled || actual || "—",
      destination: type === "arrivals" ? origin : destination,
      platform: platform || "—",
      operator: operator || "—",
      status,
      statusClass
    };
  });
}

app.get("/api/board", async (req,res)=>{
  if (!TOKEN) {
    return res.status(500).json({error:"DARWIN_TOKEN is not configured"});
  }

  const type = req.query.type === "arrivals" ? "arrivals" : "departures";

  try{
    const response = await fetch(DARWIN_URL,{
      method:"POST",
      headers:{
        "Content-Type":"application/soap+xml; charset=utf-8"
      },
      body:soapEnvelope(type)
    });

    const xml = await response.text();

    if(!response.ok){
      return res.status(response.status).json({error:"Darwin request failed", detail:xml});
    }

    const parsed = await xml2js.parseStringPromise(xml,{explicitArray:true});
    const services = parseServices(parsed,type);

    res.set("Cache-Control","no-store");
    res.json({station:"SWA",type,services,generatedAt:new Date().toISOString()});
  }catch(error){
    console.error(error);
    res.status(500).json({error:"Unable to reach Darwin",detail:error.message});
  }
});

app.listen(PORT,()=>console.log(`Swansea rail board running at http://localhost:${PORT}`));
