// Add listeners for relays
document.querySelectorAll(".relay input").forEach((toggle) => {
    toggle.addEventListener("change", async (e) => {
        const gpioId = e.target.id; // Get the GPIO ID dynamically
        const status = e.target.checked ? "ON" : "OFF"; // Determine the status (ON/OFF)

        console.log(`GPIO ${gpioId} is now ${status}`);

        const apiUrl = status === "ON" 
            ? `http://10.6.5.34:3002/focus/${gpioId}` 
            : `http://10.6.5.34:3002/defocus/${gpioId}`; // Use the appropriate API based on status

        try {
            // Call API dynamically with the GPIO ID
            const response = await fetch(apiUrl, { method: "GET" });

            if (response.ok) {
                const result = await response.json();
                console.log(`GPIO ${gpioId} updated successfully to ${status}`, result);
            } else {
                console.error(`Failed to update GPIO ${gpioId}. Status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error while updating GPIO ${gpioId}:`, error);
        }
    });
});
