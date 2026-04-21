/**
 * tests/api.test.js
 * Integration tests cho API endpoints
 * Chạy bằng: npm test
 */
const request = require("supertest");
const { expect } = require("chai");
const app = require("../server"); // Cần export app từ server.js

describe("Gym DApp Backend API Tests", function () {
  this.timeout(10000); // Timeout cho blockchain calls

  describe("GET /health", () => {
    it("should return health status", async () => {
      const res = await request(app).get("/health");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("status", "ok");
      expect(res.body).to.have.property("blockNumber");
    });
  });

  describe("GET /api/fee", () => {
    it("should return membership fee", async () => {
      const res = await request(app).get("/api/fee");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("feeWei");
      expect(res.body).to.have.property("feeEth");
    });
  });

  describe("GET /api/member/:address", () => {
    it("should return member status for valid address", async () => {
      const testAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"; // Valid checksum address
      const res = await request(app).get(`/api/member/${testAddress}`);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("address", testAddress.toLowerCase());
      expect(res.body).to.have.property("isActive");
    });

    it("should return 400 for invalid address", async () => {
      const res = await request(app).get("/api/member/invalid-address");
      expect(res.status).to.equal(400);
    });
  });

  describe("GET /api/members", () => {
    it("should return list of members", async () => {
      const res = await request(app).get("/api/members");
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("total");
      expect(res.body).to.have.property("members");
      expect(Array.isArray(res.body.members)).to.be.true;
    });
  });

  // Admin endpoints - cần authentication hoặc owner wallet
  describe("Admin Endpoints", () => {
    describe("GET /api/admin/balance", () => {
      it("should return contract balance", async () => {
        const res = await request(app).get("/api/admin/balance");
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property("balanceWei");
        expect(res.body).to.have.property("balanceEth");
      });
    });

    describe("GET /api/admin/events", () => {
      it("should return contract events", async () => {
        const res = await request(app).get("/api/admin/events");
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property("total");
        expect(res.body).to.have.property("events");
      });
    });
  });
});