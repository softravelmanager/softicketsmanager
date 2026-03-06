import Link from "next/link";
import { useState, useCallback } from "react";
import {
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Box,
} from "@mui/material";
import { Spinner } from "components";
import { Layout } from "components/users";
import { alertService, ticketsService } from "services";

export default Index;

function Index() {
  const [files, setFiles] = useState([]);
  const [content, setContent] = useState([]);
  const [uploadType, setUploadType] = useState('amadeus');
  const [textContent, setTextContent] = useState('');
  const [processedTickets, setProcessedTickets] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileUploadTypes = ['amadeus', 'travelport'];
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const handleFileChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      const filteredFiles = selectedFiles.filter(file => {
        const fileNameParts = file.name.split(".");
        const extension = fileNameParts[fileNameParts.length - 1];
        return (fileNameParts.length > 1 && extension.includes("M")) || months.includes(extension);
      });

      setFiles(filteredFiles);

      const filePromises = filteredFiles.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });
      });

      Promise.all(filePromises)
        .then(allFileContents => setContent(allFileContents))
        .catch(err => alertService.error('Error reading files: ' + err));
    } else {
      setFiles([]);
      setContent([]);
    }
  }, [months]);

  const deleteItem = useCallback((index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setContent(prevContent => prevContent.filter((_, i) => i !== index));
    const input = document.getElementById("filesInput");
    if(input) input.value = ""; // Clear the input so the user can re-select the same file(s)
  }, []);

  function getFileName(f) {
    let nameL = f.name.length;
    let nameS = f.name;
    let nameF = "";
    if (nameL > 25) {
      nameS = f.name.substring(0, 20);
      nameF = "..." + f.name.substring(f.name.length - 4, f.name.length);
    }
    return nameS + nameF;
  }

  // Renamed from onSubmit to handlePreview
  function handlePreview() {
    setIsProcessing(true);
    let parsePromise;
    const contentToUpload = fileUploadTypes.includes(uploadType) ? content : (textContent ? [textContent] : content);
    if (contentToUpload.length === 0) {
        alertService.error("Please upload a file or enter text content.");
        setIsProcessing(false);
        return;
    }
    switch (uploadType) {
      case 'airarabia':
        parsePromise = ticketsService.uploadAirArabia(contentToUpload);
        break;
      case 'wizzair':
        parsePromise = ticketsService.uploadWizzAir(contentToUpload);
        break;
      case 'flixbus':
        parsePromise = ticketsService.uploadFlixbus(contentToUpload);
        break;
      case 'travelport':
        parsePromise = ticketsService.uploadTravelPort(contentToUpload);
        break;
      case 'amadeus':
      default:
        parsePromise = ticketsService.upload(contentToUpload);
    }
    return parsePromise.then((parsedData) => {
        if (parsedData && parsedData.length > 0) {
          setProcessedTickets(parsedData);
          alertService.success(`${parsedData.length} ticket(s) parsed and ready for creation.`);
        } else {
          setProcessedTickets([]);
          alertService.error("No tickets were created. The file might be empty, in the wrong format, or this uploader isn't implemented yet.");
        }
      })
      .catch(error => alertService.error(error.message || error))
      .finally(() => setIsProcessing(false));
  }

  async function handleCreate() {
    if (processedTickets.length === 0) {
      alertService.error("No tickets to create. Please upload and parse files first.");
      return;
    }
    setIsProcessing(true);

    // Create an array of promises, one for each ticket creation
    const createPromises = processedTickets.map(ticket => ticketsService.create(ticket));

    try {
      // Use Promise.all to run all creation requests in parallel
      await Promise.all(createPromises);

      alertService.success(`${processedTickets.length} ticket(s) created successfully!`, true);
      // Reset state after successful creation
      setFiles([]);
      setContent([]);
      setTextContent('');
      setProcessedTickets([]);
      const input = document.getElementById("filesInput");
      if(input) input.value = "";
    } catch (error) {
      alertService.error(error.message || 'An error occurred during ticket creation.');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleTicketChange = (ticketIndex, fieldKey, newValue) => {
    const numericFields = [
      'agentCost',
      'paidAmount',
      'receivingAmount1',
      'receivingAmount2',
      'receivingAmount3',
      'refund',
      'supplied',
      'returned',
      'paidByAgent'
    ];

    if (numericFields.includes(fieldKey)) {
      // Allow only numbers and a single dot, and format to two decimal places on the fly
      const sanitizedValue = newValue.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
      newValue = sanitizedValue;
    }

    setProcessedTickets(currentTickets => {
      const newTickets = JSON.parse(JSON.stringify(currentTickets)); // Deep copy to be safe
      const ticketToUpdate = newTickets[ticketIndex];
      ticketToUpdate[fieldKey] = newValue;
      return newTickets;
    });
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Left Column: Upload Area */}
        <Box sx={{ flex: 1, border: '1px dashed grey', p: 2, borderRadius: 1 }}>
          <h3 style={{ marginTop: 0 }}>Upload Content</h3>
          <form id="uploadFile" method="POST" encType="multipart/form-data">
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <RadioGroup
                row
                aria-label="upload-type"
                name="upload-type-group"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                <FormControlLabel value="amadeus" control={<Radio />} label="Amadeus" />                
                <FormControlLabel value="travelport" control={<Radio />} label="Travel Port" />
                <FormControlLabel value="airarabia" control={<Radio />} label="Air Arabia" />
                <FormControlLabel value="wizzair" control={<Radio />} label="Wizz Air" />
                <FormControlLabel value="flixbus" control={<Radio />} label="Flixbus" />
              </RadioGroup>
            </FormControl>
            {fileUploadTypes.includes(uploadType) && (
              <div id="FileUpload">
                <div className="wrapper">
                  <div className="image-upload-wrap">
                    <input
                      id="filesInput"
                      className="file-upload-input"
                      type="file"
                      name="files[]"
                      accept=".M*"
                      multiple
                      onChange={handleFileChange}
                    />
                    <div className="drag-text">
                      <h3>Drag and drop files or click to upload</h3>
                    </div>
                  </div>
                </div>
                {files &&
                  files.length > 0 &&
                  files.map((file, i) => (
                    <div key={i} className="uploaded">
                      <div className="file">
                        <div className="file__name">
                          <i className="fa fa-file delete"></i>
                          <p>{getFileName(file)}</p>
                          <i
                            className="fas fa-times delete"
                            onClick={() => deleteItem(i)}
                          ></i>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {!fileUploadTypes.includes(uploadType) && (
                <Box sx={{ mt: 2 }}>
                    <TextField
                        label="Paste Content Here"
                        multiline
                        rows={15}
                        fullWidth
                        variant="outlined"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                    />
                </Box>
            )}
            <br></br>
          </form>
          <Button
            variant="contained"
            disabled={(content.length === 0 && !textContent) || isProcessing}
            color="primary"
            fullWidth
            onClick={handlePreview}
            sx={{ height: 50 }}
          >
            {isProcessing && !processedTickets.length ? <Spinner /> : 'Upload & Preview'}
          </Button>
        </Box>

        {/* Right Column: Preview and Create Area */}
        <Box sx={{ flex: 1, border: '1px dashed grey', p: 2, borderRadius: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0 }}>Preview Tickets</h3>
          <Box sx={{ flexGrow: 1, maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
            {processedTickets.length > 0 ? (
              processedTickets.map((ticket, index) => (
                <Box key={index} sx={{ border: '1px solid #ccc', p: 2, mb: 2, borderRadius: 1, background: '#f9f9f9' }}>
                  <h5>Ticket {index + 1}: {ticket.name}</h5>
                  {
                    // Group fields into pairs to create a two-column layout
                    Object.entries(ticket).reduce((acc, current, fieldIndex, allFields) => {
                      if (fieldIndex % 2 === 0) {
                        const nextField = allFields[fieldIndex + 1];
                        acc.push(
                          <Box key={fieldIndex} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                            {[current, nextField].map((field, subIndex) => {
                              if (!field) return <Box key={subIndex} sx={{ flex: 1 }} />; // Empty box for alignment if odd number of fields
                              const [key, value] = field;
                              const isNumericField = [
                                'agentCost', 'paidAmount', 'receivingAmount1', 'receivingAmount2',
                                'receivingAmount3', 'refund', 'supplied', 'returned', 'paidByAgent'
                              ].includes(key);

                              return (
                                <Box key={key} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                  <FormLabel sx={{ textTransform: 'capitalize', fontSize: '0.8rem', mb: 0.5 }}>
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </FormLabel>
                                  <TextField
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    type={isNumericField ? 'number' : 'text'}
                                    value={value}
                                    sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem', padding: '6px 8px' } }}
                                    onChange={(e) => handleTicketChange(index, key, e.target.value)}
                                    onBlur={(e) => {
                                      if (isNumericField && e.target.value) {
                                        const formattedValue = parseFloat(e.target.value).toFixed(2);
                                        handleTicketChange(index, key, formattedValue);
                                      }
                                    }}
                                    disabled={['isVoid', 'agent', 'agentId', 'iata', 'office', 'flight'].includes(key)}
                                    inputProps={isNumericField ? { step: "0.01" } : {}}
                                  />
                                </Box>
                              );
                            })}
                          </Box>
                        );
                      }
                      return acc;
                    }, [])
                  }
                </Box>
              ))
            ) : (
              <p>Upload content and click Upload & Preview to see ticket data here.</p>
            )}
          </Box>
          <Button
            variant="contained"
            color="success"
            fullWidth
            disabled={processedTickets.length === 0 || isProcessing}
            onClick={handleCreate}
            sx={{ height: 50, mt: 2 }}
          >
            {isProcessing && processedTickets.length > 0 ? <Spinner /> : `Create ${processedTickets.length > 0 ? processedTickets.length : ''} Ticket(s)`}
          </Button>
        </Box>
      </Box>
    </Layout>
  );
}
