package com.example.eventmanagement.model;

/**
 * Khu ngồi (Zone) - embedded trong Event, chỉ dùng cho sự kiện có phí
 */
public class SeatZone {

    private String id;          // vd: "zone-vip", "zone-standard"
    private String name;        // vd: "VIP", "Standard", "Economy"
    private String description; // mô tả khu
    private String color;       // màu hiển thị, vd: "#FFD700"
    private int totalSeats;     // tổng số ghế trong khu
    private int soldSeats;      // số ghế đã bán (atomic update)
    private long price;         // giá vé (VND)

    public SeatZone() {}

    public SeatZone(String id, String name, String description, String color, int totalSeats, long price) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.color = color;
        this.totalSeats = totalSeats;
        this.soldSeats = 0;
        this.price = price;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public int getTotalSeats() { return totalSeats; }
    public void setTotalSeats(int totalSeats) { this.totalSeats = totalSeats; }

    public int getSoldSeats() { return soldSeats; }
    public void setSoldSeats(int soldSeats) { this.soldSeats = soldSeats; }

    public long getPrice() { return price; }
    public void setPrice(long price) { this.price = price; }

    public int getAvailableSeats() {
        return Math.max(0, totalSeats - soldSeats);
    }
}
