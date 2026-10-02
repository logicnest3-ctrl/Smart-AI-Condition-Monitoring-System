# IIOT - Multi-Device Motor Predictive Maintenance System
### Developed & Managed by Team Penguin

A simple, practical, modular multi-device industrial condition monitoring platform and virtual SCADA system. Built using clean HTML, standard CSS, and Vanilla JavaScript with Chart.js, Three.js, and client-side jsPDF reporting.

---

## 🌟 Key Architecture & Capabilities

1. **Dedicated 3D Digital Twin Exclusively in Inspect Dashboard**:
   - The 3D Digital Twin appears **exclusively inside the inspect Dashboard performance view** when clicking **`[▼ Inspect Dashboard]`**.
   - No redundant 3D twin cluttering the live dashboard overview page.
   - Each machine (`MOTOR-01`, `MOTOR-02`, `MOTOR-03`, and commissioned assets) has its own individual Three.js 3D CAD model with a rotating shaft, cooling ribs, front/rear bearing housings, and orbit mouse controls.
   - Dynamic glowing sensor hotspot probes:
     - 🔵 **DS18B20 Temp Probe** (Stator Body - turns amber on warning, red on trip)
     - 🟢 **MPU6050 Vibration Sensor** (Bearing - turns red on high vibration)
     - 🟡 **ACS712 Current Sensor** (Terminal Junction Box)
   - Telemetry sub-bar directly below the 3D twin: Stator Temp, Bearing Vib RMS, Current Draw, and Active Wattage.

2. **AI Motor Health Score & Anomaly Detection**:
   - Explicit real-time AI Health Score (0–100%) dynamically calculated using multi-sensor anomaly classification.
   - Evaluates ISO 10816 vibration severity zones, thermal delta above setpoint, stator FLA overcurrent, and sensor probe continuity.
   - Outputs confidence metrics (e.g., 96% Model Confidence) and status classifications (`OPTIMAL`, `ACCEPTABLE`, `WARNING`, `CRITICAL`).

3. **AI Estimated Maintenance Date Calculation**:
   - Dynamic forecasting of the exact calendar maintenance date (e.g. `📅 24 Mar 2027 (~177 Days)`).
   - Combines operating hours remaining (RUL), shift schedule (daily run hours & operating days per week), and mechanical/thermal stress acceleration factors.

4. **Dropdown Dashboard Accordion ("Inspect in the Drop Down")**:
   - Clicking **"Inspect Dashboard"** on any motor card in the fleet expands its full telemetry dashboard inline directly underneath that specific card.
   - Displays that machine's dedicated 3D Digital Twin, 3 live Chart.js graphs (Temperature vs Time, Vibration RMS vs Time, Current Draw vs Time), temperature maintenance slider, manual value overrides, and ₹ INR electricity billing.

5. **Vertical Scrolling Stack ("One by One Scrolling Down")**:
   - The "Monitored Machines & Devices" section displays assets one by one in a spacious, full-width vertical scrolling feed.
   - No cramped horizontal grids; engineers can easily review and inspect each machine sequentially.

6. **Role-Based Authentication Portals (`login.html`)**:
   - **Maintenance Developer Portal**:
     - Username: `maintaince`
     - Password: `maintance1605`
     - Full administrative privileges: commission new machines, calibrate thresholds, override parameters, inject simulations.
   - **Operator / User Portal**:
     - Custom user registration: operators can set their own custom username and password.
     - Live operational condition monitoring, 3D inspection, and PDF audit exports.

7. **Dynamic "Add New Machine" Provisioning**:
   - Operators & Maintenance Developers can add new machines to the active fleet via `[+ Add New Machine]`.
   - Specify Machine ID (e.g. `MOTOR-04`), Machine Name, Process & Location, Power (kW), FLA (Amps), Voltage (415V/230V), and Target Maintenance Temperature.
   - Instantly generates sub-second telemetry streams, dedicated 3D Digital Twin, sensor diagnostic matrix, schedule trackers, and adds to PDF audit exports.

8. **Industrial Acoustic Alert Buzzer (Web Audio API)**:
   - Sounds an audible dual-tone emergency alert buzzer on **ANY** abnormality across the fleet (High temperature, bearing vibration exceedance, stator overload, or sensor hardware disconnect).
   - Prominent visual pulsing alarm banner with 1-click sound muting.

9. **Temperature Maintenance & Manual Value Setting**:
   - Configure target operating maintenance temperatures and alarm thresholds.
   - Automated cooling relay interlock (`IDLE` vs `ACTIVE (FAN ON)`).
   - Manual override mode: inject custom temperature, vibration, and current values to test alarms and safety interlocks.

10. **Shift Schedule, Electricity Billing (₹ INR) & Wear-Tear Management**:
    - Shift start/end times and operating days per week.
    - Electricity tariff in **₹ INR / kWh** (default ₹8.00/kWh).
    - Real-time energy consumption (kWh), daily electricity bill (₹ INR), monthly projection (₹ INR), and mechanical wear-and-tear index (0-100%).

11. **1-Click Comprehensive PDF Audit Reports (`jsPDF`)**:
    - Generates client-side multi-page audit report:
      - Executive fleet summary table across all units with AI Health Scores & AI Maintenance Dates
      - Shift schedule & ₹ INR electricity billing table
      - **Abnormal Activities & Anomaly Incidents Register**: Detailed audit log of every abnormal event, root cause, and corrective action
      - **Complete Telemetry Readings Log**: Historical timestamped sensor captures
      - Official developer credits printed strictly at the end of the report.

12. **New Browser Tab Separation**:
    - All links opening the live dashboard use `target="_blank" rel="noopener noreferrer"`.

---

## 👥 Ownership & Developer Credits

```text
ALL CREDITS AND DEVELOPED BY TEAM PENGUIN
1. Syed Siddiq Hussaini 160524747018
2. Syed Rafay Ali 160524747055
3. Mohammed Abdul Raheem 160524747053
```

- **Syed Siddiq Hussaini** (Roll No: `160524747018`) — Core Hardware & ESP32 Architecture • Team Penguin
- **Syed Rafay Ali** (Roll No: `160524747055`) — Vibration Diagnostics & Signal Processing • Team Penguin
- **Mohammed Abdul Raheem** (Roll No: `160524747053`) — Telemetry Dashboard & MQTT Infrastructure • Team Penguin

---

## 📁 Pages Included

1. [**`index.html`**](file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/index.html) - Homepage (Focused on Industrial Problems & Solutions)
2. [**`dashboard.html`**](file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/dashboard.html) - Live Multi-Device Dashboard with Dedicated 3D Digital Twin inside Inspect View (Opens in New Tab)
3. [**`login.html`**](file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/login.html) - Dual Access Portals (Maintenance Developer: `maintaince`/`maintance1605` & Custom Operator)
4. [**`about.html`**](file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/about.html) - Engineering Features & Hardware Specifications Table
5. [**`pricing.html`**](file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/pricing.html) - Transparent Plans in Indian Rupees (₹2,999/mo Lab, ₹9,999/mo Plant)
6. [**`contact.html`**](file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/contact.html) - Direct Contact Channel to Team Penguin
7. [**`404.html`**](file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/404.html) - Clean 404 Fallback Page
8. [**`privacy.html`**](file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/privacy.html) - Telemetry Privacy & Edge Security Policy
9. [**`terms.html`**](file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/terms.html) - Operational Terms of Service

---

## 🚀 How to Open

Open directly in any modern browser:
```text
file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/index.html
file:///C:/Users/Admin/.gemini/antigravity/scratch/pulseguard-platform/dashboard.html
```
