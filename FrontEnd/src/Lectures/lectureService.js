const API_BASE = 'http://localhost/CyberEdu/BackEnd';

export const lectureService = {
    // Dohvati sva predavanja
    getAllLectures: async () => {
        try {
            const response = await fetch(`${API_BASE}/lectures/get_lectures.php`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching lectures:', error);
            throw error;
        }
    },

    // Dohvati detalje predavanja
    getLectureDetails: async (id) => {
        try {
            const response = await fetch(`${API_BASE}/lectures/get_lecture_details.php?id=${id}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching lecture details:', error);
            throw error;
        }
    },

    // Admin funkcije
    createLecture: async (lectureData) => {
        try {
            const response = await fetch(`${API_BASE}/admin/create_lecture.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(lectureData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating lecture:', error);
            throw error;
        }
    },

    updateLecture: async (id, lectureData) => {
        try {
            const response = await fetch(`${API_BASE}/admin/update_lecture.php?id=${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(lectureData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating lecture:', error);
            throw error;
        }
    },

    deleteLecture: async (id) => {
        try {
            const response = await fetch(`${API_BASE}/admin/delete_lecture.php?id=${id}`, {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting lecture:', error);
            throw error;
        }
    }
};