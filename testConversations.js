import fetch from 'node-fetch';

const testConversations = async () => {
  const url = 'http://localhost:5000/conversations';
  const token = '<your_token_here>'; // Replace with a valid token

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Conversations:', data);
    } else {
      console.error('Failed to fetch conversations:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testConversations();