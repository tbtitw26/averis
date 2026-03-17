import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
}

await mongoose.connect(mongoUri);

const userSchema = new mongoose.Schema(
    {
        name: String,
        firstName: { type: String, default: null },
        lastName: { type: String, default: null },
        phoneNumber: { type: String, default: null },
        dateOfBirth: { type: Date, default: null },
        street: { type: String, default: null },
        city: { type: String, default: null },
        country: { type: String, default: null },
        postCode: { type: String, default: null },
    },
    { strict: false, collection: "users" }
);

const User = mongoose.models.BackfillUser || mongoose.model("BackfillUser", userSchema);

const cursor = User.find({}).cursor();
let updatedCount = 0;

for await (const user of cursor) {
    const update = {};

    if (!user.firstName && user.name) {
        const [firstName = "", ...rest] = String(user.name).trim().split(/\s+/);
        update.firstName = firstName || null;
        update.lastName = rest.length ? rest.join(" ") : null;
    }

    if (user.firstName === undefined) update.firstName ??= null;
    if (user.lastName === undefined) update.lastName ??= null;
    if (user.phoneNumber === undefined) update.phoneNumber = null;
    if (user.dateOfBirth === undefined) update.dateOfBirth = null;
    if (user.street === undefined) update.street = null;
    if (user.city === undefined) update.city = null;
    if (user.country === undefined) update.country = null;
    if (user.postCode === undefined) update.postCode = null;

    if (Object.keys(update).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: update });
        updatedCount += 1;
    }
}

console.log(`Backfilled ${updatedCount} user records.`);

await mongoose.disconnect();
