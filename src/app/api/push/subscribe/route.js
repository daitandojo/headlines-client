// src/app/api/push/subscribe/route.js (version 1.0)
import dbConnect from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";

export async function POST(req) {
    try {
        await dbConnect();
        const subscription = await req.json();

        if (!subscription || !subscription.endpoint) {
            return new Response(JSON.stringify({ error: "Invalid subscription object." }), { status: 400 });
        }

        // Use updateOne with upsert to avoid duplicate subscriptions
        await PushSubscription.updateOne(
            { endpoint: subscription.endpoint },
            { $set: subscription },
            { upsert: true }
        );

        return new Response(JSON.stringify({ success: true, message: "Subscription saved." }), { status: 201 });

    } catch (error) {
        console.error("Error saving push subscription:", error);
        return new Response(JSON.stringify({ error: "Failed to save subscription." }), { status: 500 });
    }
}

  