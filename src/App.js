import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'

function App() {
  const [channelId, setChannelId] = useState(null)
  const [channelData, setChannelData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImages, setSelectedImages] = useState([]) // Array for multi-select
  const { process_id } = useParams()

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('youtube_prep')
          .select('status, channel_id, channel_data')
          .eq('process_id', process_id)
          .single()

        if (error) throw error

        if (data && data.status === 'waiting') {
          setChannelId(data.channel_id)
          setChannelData(JSON.parse(data.channel_data)) // Parse the updated structure
        }
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (process_id) {
      fetchData()
    }
  }, [process_id])

  const handleImageClick = (index) => {
    // Toggle selection with limit based on "to_select"
    setSelectedImages((prevSelected) => {
      if (prevSelected.includes(index)) {
        return prevSelected.filter((id) => id !== index) // Deselect
      } else if (prevSelected.length < channelData.to_select) {
        return [...prevSelected, index] // Select
      } else {
        alert(`You can only select up to ${channelData.to_select} items.`)
        return prevSelected
      }
    })
  }

  const handleSubmit = async () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image or video first.')
      return
    }

    // Create a comma-separated list of selected file IDs
    const user_choice = selectedImages.map(index => channelData.list_of_files[index].file_id).join(',')

    await updateStatus('selected', user_choice)
  }

  const handleReject = async () => {
    await updateStatus('rejected')
  }

  const updateStatus = async (status, user_choice = null) => {
    setLoading(true)
    try {
      const updateData = { status }
      if (user_choice) {
        updateData.user_choice = user_choice
      }

      const { error } = await supabase
        .from('youtube_prep')
        .update(updateData)
        .eq('process_id', process_id)

      if (error) throw error

      alert(`Process ${status} successfully!`)
    } catch (error) {
      alert('Error updating status: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!channelId || !channelData || !Array.isArray(channelData.list_of_files)) 
    return <div>Already solved or No data to display</div>

  return (
    <div>
      <h1>Process Viewer</h1>
      <p>Channel ID: {channelId}</p>
      <h2>Channel Information</h2>
      <p>Author: {channelData.author}</p>
      <p>Channel Name: {channelData.channel_name}</p>
      <p>Video Length: {channelData.video_lenght_in_seconds} seconds</p>
      <p>Max File Size: {channelData.max_file_size} bytes</p>
      <p>To Select: {channelData.to_select}</p>
      <p>Content Type: {channelData.content_type}</p>
      <p>FPS: {channelData.fps}</p>
      <p>Prompt: {channelData.stability_prompt}</p>

      <h2>{channelData.content_type === 'image' ? 'Images' : 'Videos'}</h2>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        gap: '20px'
      }}>
        {channelData.list_of_files.map((file, index) => (
          <div 
            key={file.file_id} 
            style={{ 
              width: '400px', 
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            {channelData.content_type === 'image' ? (
              <>
                <img 
                  src={file.s3_url} 
                  alt={`Frame ${file.file_id}`} 
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    border: selectedImages.includes(index) ? '4px solid green' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleImageClick(index)}
                />
                <p>{file.name}</p>
              </>
            ) : (
              <>
                <video 
                  controls 
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    border: selectedImages.includes(index) ? '4px solid green' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleImageClick(index)}
                >
                  <source src={file.s3_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <p>{file.name}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
        <button 
          onClick={handleSubmit} 
          disabled={selectedImages.length === 0 || loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Selection'}
        </button>
        
        <button 
          onClick={handleReject} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
    </div>
  )
}

export default App