
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export const convertImageToBase64 = async (imageSrc) => {
  try {
    const response = await fetch(imageSrc);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
};

export const generateUnifiedInvoicePrintContent = async (invoiceData) => {
  console.log('=== INVOICE DATA DEBUG ===');
  console.log('invoiceData:', invoiceData);
  console.log('invoiceNumber:', invoiceData.invoiceNumber);
  console.log('clientFirstName:', invoiceData.clientFirstName);
  console.log('invoiceDate:', invoiceData.invoiceDate);
  console.log('=== END DEBUG ===');

  // No longer need to convert images since header is removed

  const clientName = [
    invoiceData.clientFirstName,
    invoiceData.clientMiddleName,
    invoiceData.clientLastName
  ].filter(Boolean).join(' ') || invoiceData.clientName || 'N/A';

  const today = new Date().toLocaleDateString('en-IN');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoiceData.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 20px; 
          line-height: 1.6;
          color: #333;
        }
        
        .letterhead-space {
          height: 500px;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        
        .invoice-header { 
          text-align: center; 
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .invoice-meta {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 10px;
        }
        .invoice-title { 
          font-size: 28px; 
          font-weight: bold; 
          margin-bottom: 10px;
          color: #2c3e50;
        }
        .invoice-details { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 30px; 
          margin-bottom: 30px;
        }
        .detail-section h3 { 
          margin-bottom: 10px; 
          font-size: 16px;
          color: #34495e;
          border-bottom: 1px solid #bdc3c7;
          padding-bottom: 5px;
        }
        .detail-section p { 
          margin: 5px 0; 
          font-size: 14px;
        }
        .files-section { 
          margin: 30px 0;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 5px;
        }
        .files-section h3 {
          color: #2c3e50;
          margin-bottom: 15px;
        }
        .financial-section { 
          margin-top: 30px;
          border-top: 2px solid #333;
          padding-top: 20px;
          text-align: right;
        }
        .financial-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 10px;
          padding: 5px 0;
        }
        .financial-row.total { 
          font-weight: bold; 
          font-size: 18px;
          border-top: 1px solid #333;
          padding-top: 15px;
          margin-top: 15px;
        }
        .footer { 
          margin-top: 50px;
          text-align: center;
          border-top: 1px solid #ddd;
          padding-top: 20px;
          font-size: 12px;
          color: #666;
        }
        
        @media print {
          body { 
            margin: 0; 
            padding-top: 0;
          }
          .letterhead-space {
            height: 500px;
            margin-bottom: 30px;
            page-break-inside: avoid;
            background: white;
            display: block;
          }
        }
      </style>
    </head>
    <body>
      <!-- Space reserved for letterhead -->
      <div style="height: 500px; border: 1px solid red; background-color: #f0f0f0; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
        <h2 style="color: red;">LETTERHEAD SPACE - 500px</h2>
      </div>
      
      <div class="invoice-header">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-meta">
          <p><strong>Invoice No:</strong> ${invoiceData.invoiceNumber || 'N/A'}</p>
          <p><strong>Date:</strong> ${invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div class="invoice-details">
        <div class="detail-section">
          <h3>Bill To:</h3>
          <p><strong>${clientName}</strong></p>
          <p>${invoiceData.clientAddress}</p>
          ${invoiceData.clientGstNumber ? `<p><strong>GST No:</strong> ${invoiceData.clientGstNumber}</p>` : ''}
        </div>
        
        <div class="detail-section">
          <h3>Bill From:</h3>
          <p><strong>S. Sen & Associates</strong></p>
          <p>Professional Valuation Services</p>
          <p>Registered Valuer & Property Consultant</p>
          ${invoiceData.branchName ? `<p><strong>Branch:</strong> ${invoiceData.branchName}</p>` : ''}
        </div>
      </div>

      ${invoiceData.currentFile || (invoiceData.additionalFiles && invoiceData.additionalFiles.length) ? `
        <div class="files-section">
          <h3>Files/Reports:</h3>
          ${invoiceData.currentFile ? `
            <p><strong>Main File:</strong> ${invoiceData.currentFile.fileNumber} - ${invoiceData.currentFile.propertyType} at ${invoiceData.currentFile.propertyAddress}</p>
          ` : ''}
          ${invoiceData.additionalFiles && invoiceData.additionalFiles.length > 0 ? `
            <p><strong>Additional Files:</strong></p>
            ${invoiceData.additionalFiles.map(file => `
              <p style="margin-left: 15px;">• ${file.fileNumber} - ${file.propertyType} at ${file.propertyAddress}</p>
            `).join('')}
          ` : ''}
        </div>
      ` : ''}

      <div class="financial-section">
        <div class="financial-row">
          <span>Professional Fees:</span>
          <span>₹${parseFloat(invoiceData.professionalFees || 0).toLocaleString('en-IN')}</span>
        </div>
        
        ${invoiceData.advance && parseFloat(invoiceData.advance) > 0 ? `
          <div class="financial-row">
            <span>Advance Received:</span>
            <span>-₹${parseFloat(invoiceData.advance).toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
        
        ${invoiceData.gstApplicable ? `
          <div class="financial-row">
            <span>Subtotal:</span>
            <span>₹${(parseFloat(invoiceData.professionalFees || 0) - parseFloat(invoiceData.advance || 0)).toLocaleString('en-IN')}</span>
          </div>
          <div class="financial-row">
            <span>GST (18%):</span>
            <span>₹${((parseFloat(invoiceData.professionalFees || 0) - parseFloat(invoiceData.advance || 0)) * 0.18).toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
        
        <div class="financial-row total">
          <span>Total Amount:</span>
          <span>₹${(invoiceData.calculatedTotal || invoiceData.total || parseFloat(invoiceData.professionalFees || 0) - parseFloat(invoiceData.advance || 0)).toLocaleString('en-IN')}</span>
        </div>
      </div>

      ${invoiceData.notes ? `
        <div style="margin-top: 30px;">
          <h3>Notes:</h3>
          <p style="white-space: pre-wrap;">${invoiceData.notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        <p>Generated on ${today}</p>
        <p><em>This is a computer-generated invoice.</em></p>
      </div>
    </body>
    </html>
  `;
};

export const printInvoice = async (invoiceData) => {
  const printContent = await generateUnifiedInvoicePrintContent(invoiceData);
  
  console.log('Print content being generated:', printContent.substring(0, 1000));
  
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Add a small delay to ensure content is loaded
  setTimeout(() => {
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);
  }, 500);
};

export const exportInvoiceAsWord = async (invoiceData) => {
  const clientName = [
    invoiceData.clientFirstName,
    invoiceData.clientMiddleName,
    invoiceData.clientLastName
  ].filter(Boolean).join(' ') || invoiceData.clientName || 'N/A';

  const calculateGST = () => {
    const subtotal = (invoiceData.professionalFees || 0) - (invoiceData.advance || 0);
    const gstRate = 0.18;
    const gstAmount = subtotal * gstRate;
    const totalWithGST = subtotal + gstAmount;
    return {
      subtotal,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: gstAmount,
      totalWithGST
    };
  };

  const gstCalculation = calculateGST();

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Letterhead space - 20 empty lines (approximately 500px equivalent)
          ...Array(20).fill().map(() => new Paragraph({ children: [new TextRun("")] })),
          
          // Invoice Header
          new Paragraph({
            children: [
              new TextRun({
                text: "INVOICE",
                bold: true,
                size: 32
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Invoice No: ${invoiceData.invoiceNumber || 'N/A'}`,
                bold: true
              }),
              new TextRun({
                text: `                    Date: ${invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}`,
                bold: true
              })
            ],
            spacing: { after: 400 }
          }),
          
          // Bill To Section
          new Paragraph({
            children: [
              new TextRun({
                text: "Bill To:",
                bold: true,
                size: 24
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: clientName,
                bold: true
              })
            ]
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: invoiceData.clientAddress || ''
              })
            ]
          }),
          
          ...(invoiceData.clientGstNumber ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `GST No: ${invoiceData.clientGstNumber}`,
                  bold: true
                })
              ]
            })
          ] : []),
          
          new Paragraph({
            children: [new TextRun("")],
            spacing: { after: 400 }
          }),
          
          // Service Details Table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: [
              // Header row
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Description",
                            bold: true
                          })
                        ]
                      })
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 }
                    }
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Amount",
                            bold: true
                          })
                        ],
                        alignment: AlignmentType.RIGHT
                      })
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 }
                    }
                  })
                ]
              }),
              
              // Professional fees row
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun("Professional Consultation Fees")]
                      })
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 }
                    }
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun(`₹${parseFloat(invoiceData.professionalFees || 0).toLocaleString('en-IN')}`)
                        ],
                        alignment: AlignmentType.RIGHT
                      })
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 }
                    }
                  })
                ]
              }),
              
              // Advance row (if applicable)
              ...(invoiceData.advance && parseFloat(invoiceData.advance) > 0 ? [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [new TextRun("Less: Advance Received")]
                        })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun(`-₹${parseFloat(invoiceData.advance).toLocaleString('en-IN')}`)
                          ],
                          alignment: AlignmentType.RIGHT
                        })
                      ],
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 }
                      }
                    })
                  ]
                })
              ] : []),
              
              // Subtotal row
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Subtotal",
                            bold: true
                          })
                        ]
                      })
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 }
                    }
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `₹${(invoiceData.total || gstCalculation.subtotal).toLocaleString('en-IN')}`,
                            bold: true
                          })
                        ],
                        alignment: AlignmentType.RIGHT
                      })
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1 },
                      bottom: { style: BorderStyle.SINGLE, size: 1 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 }
                    }
                  })
                ]
              }),
              
              // GST rows (if applicable)
              ...(invoiceData.gstApplicable ? [
                ...(invoiceData.gstType === 'cgst_sgst' ? [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun("CGST (9%)")] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [new TextRun(`₹${gstCalculation.cgst.toLocaleString('en-IN')}`)],
                            alignment: AlignmentType.RIGHT
                          })
                        ],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun("SGST (9%)")] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [new TextRun(`₹${gstCalculation.sgst.toLocaleString('en-IN')}`)],
                            alignment: AlignmentType.RIGHT
                          })
                        ],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  })
                ] : [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun("IGST (18%)")] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [new TextRun(`₹${gstCalculation.igst.toLocaleString('en-IN')}`)],
                            alignment: AlignmentType.RIGHT
                          })
                        ],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  })
                ])
              ] : []),
              
              // Total row
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: invoiceData.gstApplicable ? "Total Amount (Inc. GST)" : "Total Amount",
                            bold: true,
                            size: 24
                          })
                        ]
                      })
                    ],
                    borders: {
                      top: { style: BorderStyle.DOUBLE, size: 2 },
                      bottom: { style: BorderStyle.DOUBLE, size: 2 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 }
                    }
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `₹${(invoiceData.gstApplicable ? gstCalculation.totalWithGST : (invoiceData.total || gstCalculation.subtotal)).toLocaleString('en-IN')}`,
                            bold: true,
                            size: 24
                          })
                        ],
                        alignment: AlignmentType.RIGHT
                      })
                    ],
                    borders: {
                      top: { style: BorderStyle.DOUBLE, size: 2 },
                      bottom: { style: BorderStyle.DOUBLE, size: 2 },
                      left: { style: BorderStyle.SINGLE, size: 1 },
                      right: { style: BorderStyle.SINGLE, size: 1 }
                    }
                  })
                ]
              })
            ]
          }),
          
          // Notes section (if applicable)
          ...(invoiceData.notes ? [
            new Paragraph({
              children: [new TextRun("")],
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Notes:",
                  bold: true,
                  size: 24
                })
              ],
              spacing: { after: 200 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: invoiceData.notes
                })
              ]
            })
          ] : [])
        ]
      }
    ]
  });
  
  // Generate and save the document
  const blob = await Packer.toBlob(doc);
  const fileName = `Invoice_${invoiceData.invoiceNumber || 'N/A'}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName);
};