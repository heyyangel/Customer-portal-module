import Product from '../models/Product.js';

export const seedDefaultProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count > 0) return; // Products already seeded

    console.log('[Seed] Seeding default products...');

    const defaultProducts = [
      {
        productCode: "E-10021",
        msilCode: "MS10021",
        name: "Electrical Copper Cable 2.5mm",
        brand: "ABC Cables",
        category: "Electrical",
        warehouse: "Warehouse A",
        price: 210,
        availableStock: 125,
        reservedStock: 12,
        unit: "PCS"
      },
      {
        productCode: "E-10056",
        msilCode: "MS10056",
        name: "LED Panel Light 40W",
        brand: "Lumina Tech",
        category: "Electrical",
        warehouse: "Warehouse B",
        price: 450,
        availableStock: 60,
        reservedStock: 5,
        unit: "PCS"
      },
      {
        productCode: "E-10444",
        msilCode: "MS10444",
        name: "Circuit Breaker MCB 16A",
        brand: "SafeSwitch",
        category: "Electrical",
        warehouse: "Warehouse A",
        price: 320,
        availableStock: 8,
        reservedStock: 2,
        unit: "PCS"
      },
      {
        productCode: "E-20431",
        msilCode: "MS20431",
        name: "Industrial Exhaust Fan 12-inch",
        brand: "AirBreeze",
        category: "Electrical",
        warehouse: "Warehouse C",
        price: 1850,
        availableStock: 45,
        reservedStock: 8,
        unit: "PCS"
      },
      {
        productCode: "F-20011",
        msilCode: "MS20011",
        name: "Threaded Hex Bolt M12",
        brand: "FastenCo",
        category: "Fasteners",
        warehouse: "Warehouse A",
        price: 12,
        availableStock: 850,
        reservedStock: 120,
        unit: "PCS"
      },
      {
        productCode: "F-20114",
        msilCode: "MS20114",
        name: "Self Tapping Screw Set",
        brand: "FastenCo",
        category: "Fasteners",
        warehouse: "Warehouse A",
        price: 85,
        availableStock: 34,
        reservedStock: 4,
        unit: "Packs"
      },
      {
        productCode: "F-20191",
        msilCode: "MS20191",
        name: "Heavy Duty Anchor Bolt M16",
        brand: "StrongHold",
        category: "Fasteners",
        warehouse: "Warehouse B",
        price: 75,
        availableStock: 180,
        reservedStock: 20,
        unit: "PCS"
      },
      {
        productCode: "P-30111",
        msilCode: "MS30111",
        name: "Seamless Steel Pipe 2-inch",
        brand: "Apex Metals",
        category: "Piping",
        warehouse: "Warehouse B",
        price: 480,
        availableStock: 142,
        reservedStock: 15,
        unit: "PCS"
      },
      {
        productCode: "P-30222",
        msilCode: "MS30222",
        name: "PVC Elbow Joint 90 Deg",
        brand: "FlowMax",
        category: "Piping",
        warehouse: "Warehouse C",
        price: 45,
        availableStock: 300,
        reservedStock: 50,
        unit: "PCS"
      },
      {
        productCode: "P-30456",
        msilCode: "MS30456",
        name: "Stainless Steel Flange 4-inch",
        brand: "Apex Metals",
        category: "Piping",
        warehouse: "Warehouse A",
        price: 1250,
        availableStock: 3,
        reservedStock: 0,
        unit: "PCS"
      },
      {
        productCode: "M-40101",
        msilCode: "MS40101",
        name: "Hydraulic Pump H-300",
        brand: "FluidPower",
        category: "Mechanical",
        warehouse: "Warehouse C",
        price: 14500,
        availableStock: 8,
        reservedStock: 1,
        unit: "PCS"
      },
      {
        productCode: "M-40202",
        msilCode: "MS40202",
        name: "Gearbox Assembly G-120",
        brand: "RotaryMotion",
        category: "Mechanical",
        warehouse: "Warehouse B",
        price: 28900,
        availableStock: 12,
        reservedStock: 2,
        unit: "PCS"
      },
      {
        productCode: "M-40333",
        msilCode: "MS40333",
        name: "Radial Ball Bearing 6204",
        brand: "GlideTech",
        category: "Mechanical",
        warehouse: "Warehouse A",
        price: 150,
        availableStock: 250,
        reservedStock: 30,
        unit: "PCS"
      },
      {
        productCode: "S-50110",
        msilCode: "MS50110",
        name: "Structural Steel I-Beam 6m",
        brand: "Apex Metals",
        category: "Structural",
        warehouse: "Warehouse B",
        price: 8500,
        availableStock: 22,
        reservedStock: 4,
        unit: "PCS"
      },
      {
        productCode: "S-50220",
        msilCode: "MS50220",
        name: "Mild Steel Plate 8mm x 4ft x 8ft",
        brand: "Apex Metals",
        category: "Structural",
        warehouse: "Warehouse B",
        price: 6400,
        availableStock: 15,
        reservedStock: 3,
        unit: "PCS"
      },
      {
        productCode: "I-60101",
        msilCode: "MS60101",
        name: "Digital Pressure Gauge 10 Bar",
        brand: "SensorsInd",
        category: "Instrumentation",
        warehouse: "Warehouse C",
        price: 3200,
        availableStock: 55,
        reservedStock: 5,
        unit: "PCS"
      },
      {
        productCode: "I-60202",
        msilCode: "MS60202",
        name: "Temperature Transmitter 4-20mA",
        brand: "SensorsInd",
        category: "Instrumentation",
        warehouse: "Warehouse A",
        price: 7400,
        availableStock: 28,
        reservedStock: 2,
        unit: "PCS"
      },
      {
        productCode: "E-10088",
        msilCode: "MS10088",
        name: "Industrial Battery Backup UPS 3kVA",
        brand: "VoltShield",
        category: "Electrical",
        warehouse: "Warehouse B",
        price: 24500,
        availableStock: 6,
        reservedStock: 1,
        unit: "PCS"
      },
      {
        productCode: "F-20222",
        msilCode: "MS20222",
        name: "Spring Washer Set M6-M20",
        brand: "FastenCo",
        category: "Fasteners",
        warehouse: "Warehouse A",
        price: 95,
        availableStock: 40,
        reservedStock: 5,
        unit: "Packs"
      },
      {
        productCode: "P-30555",
        msilCode: "MS30555",
        name: "Butterfly Valve 3-inch PN16",
        brand: "FlowControl",
        category: "Piping",
        warehouse: "Warehouse C",
        price: 4200,
        availableStock: 14,
        reservedStock: 2,
        unit: "PCS"
      }
    ];

    await Product.insertMany(defaultProducts);
    console.log('[Seed] Default products seeded successfully.');
  } catch (error) {
    console.error(`[Seed Error] Failed to seed products: ${error.message}`);
  }
};
