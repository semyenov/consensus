import { EdgeDBStorage } from "./storage/edgedb";
import { setupDatabase } from "./orbitdbClient";

async function main() {
  // Setup the EdgeDB-backed storage instance
  const storage = await EdgeDBStorage.create();

  // Setup the OrbitDB instance
  const dbName = "edge-orbitdb";
  const db = await setupDatabase(dbName);

  // Perform CRUD operations and synchronize
  const hash = "item1";
  const value = { content: "Hello, EdgeDB and OrbitDB" };

  // Create: Insert item into EdgeDB
  await storage.put(hash, value);

  // Read: Synchronize OrbitDB with EdgeDB
  await storage.get(hash).then((item) => {
    if (item) {
      db.put(hash, item);
    }
  });

  // Fetch item from OrbitDB
  const orbitValue = db.get(hash);
  console.log("OrbitDB Item Content:", orbitValue);

  // Update: Update item in EdgeDB
  await storage.put(hash, { content: "Updated Content" });

  // Resynchronize OrbitDB with EdgeDB
  await storage.get(hash).then((item) => {
    if (item) {
      db.put(hash, item);
    }
  });

  // Fetch updated item from OrbitDB
  const updatedOrbitValue = db.get(hash);
  console.log("Updated OrbitDB Item Content:", updatedOrbitValue);

  // Delete: Clean up
  await storage.del(hash);

  // Verify deletion in OrbitDB
  const deletedOrbitValue = db.get(hash);
  console.log("Deleted OrbitDB Item Content:", deletedOrbitValue);
}

main().catch(console.error);
