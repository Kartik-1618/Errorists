const checkModels = async () => {
    const key = 'AIzaSyDcbAO1BuLD2S2EKcNW1m1_srY0VjMU3Xg';
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('✅ Available Models:');
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.error('❌ No models found or error:', data);
        }
    } catch (e) {
        console.error('❌ Network Error:', e);
    }
};

checkModels();
