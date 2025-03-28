import zustand from 'zustand';

// load grout range from json
const loadGroutRange = async () => {
    try {
        const response = await fetch("/groutRange.json");
        const data = await response.json();
        return data.groutRange;
    } catch (error) {
        console.error("Error loading grout range", error);
        return [];
    }
}