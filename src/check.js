//just for testing the open API for the F1 GAME

fetch('https://api.openf1.org/v1/meetings?year=2024')
  .then(response => response.json())
  .then(data => {
    const currentDate = new Date('2024-06-01T00:00:00Z');
    const upcomingMeetings = data.filter(meeting => new Date(meeting.date_start) > currentDate);
    const nextGP = upcomingMeetings.sort((a, b) => new Date(a.date_start) - new Date(b.date_start))[0];
    console.log("Next GP:", nextGP.meeting_name);
  })
  .catch(error => console.log("Next GP: TBD"));