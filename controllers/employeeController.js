const { getFirestore } = require('../config/firebase');
const { uploadToImageKit } = require('../config/imagekit');

// Generate unique 7-digit employee ID
const generateEmployeeId = () => {
    const min = 1000000; // 7 digits minimum
    const max = 9999999; // 7 digits maximum
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Check if employee ID already exists
const isEmployeeIdUnique = async (employeeId) => {
    try {
        const db = getFirestore();
        const employeeDoc = await db.collection('employees').doc(employeeId.toString()).get();
        return !employeeDoc.exists;
    } catch (error) {
        console.error('Error checking employee ID uniqueness:', error);
        return false;
    }
};

// Generate unique employee ID
const generateUniqueEmployeeId = async () => {
    let employeeId;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
        employeeId = generateEmployeeId();
        isUnique = await isEmployeeIdUnique(employeeId);
        attempts++;
    }

    if (!isUnique) {
        throw new Error('Unable to generate unique employee ID after multiple attempts');
    }

    return employeeId.toString();
};

class EmployeeController {

    // Add new employee
    async addEmployee(req, res) {
        try {
            const employeeData = req.body;
            const files = req.files;

            // Generate unique employee ID
            const employeeId = await generateUniqueEmployeeId();
            
            // Create folder path for this employee
            const employeeFolderPath = `/Employees/${employeeId}`;

            let profilePictureUrl = null;
            let governmentProofUrl = null;

            // Upload profile picture if provided
            if (files && files.profilePicture && files.profilePicture[0]) {
                const profilePicFile = files.profilePicture[0];
                const profilePicResult = await uploadToImageKit(
                    profilePicFile,
                    `profile_${employeeId}.${profilePicFile.originalname.split('.').pop()}`,
                    employeeFolderPath
                );

                if (profilePicResult.success) {
                    profilePictureUrl = profilePicResult.data.url;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Failed to upload profile picture',
                        error: profilePicResult.error
                    });
                }
            }

            // Upload government proof if provided
            if (files && files.governmentProof && files.governmentProof[0]) {
                const govProofFile = files.governmentProof[0];
                const govProofResult = await uploadToImageKit(
                    govProofFile,
                    `government_proof_${employeeId}.${govProofFile.originalname.split('.').pop()}`,
                    employeeFolderPath
                );

                if (govProofResult.success) {
                    governmentProofUrl = govProofResult.data.url;
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Failed to upload government proof',
                        error: govProofResult.error
                    });
                }
            }

            // Prepare employee data for Firestore
            const employeeRecord = {
                employeeId: employeeId,
                
                // Personal Details
                firstName: employeeData.firstName || '',
                lastName: employeeData.lastName || '',
                email: employeeData.email || '',
                mobileNumber: employeeData.mobileNumber || '',
                password: employeeData.password || '', // Note: Consider hashing this
                accessRights: Array.isArray(employeeData.accessRights) ? employeeData.accessRights : [],
                
                // Profile Picture
                profilePicture: profilePictureUrl,
                
                // Government Proof
                governmentProof: governmentProofUrl,
                governmentProofType: employeeData.governmentProofType || '',
                governmentProofNumber: employeeData.governmentProofNumber || '',

                // Professional Details
                yearsOfExperience: employeeData.yearsOfExperience || '',
                lastCompanyName: employeeData.lastCompanyName || '',
                lastJobTitle: employeeData.lastJobTitle || '',
                lastSalary: employeeData.lastSalary || '',
                reasonForLeaving: employeeData.reasonForLeaving || '',

                // Bank Details
                bankName: employeeData.bankName || '',
                accountNumber: employeeData.accountNumber || '',
                ifscCode: employeeData.ifscCode || '',
                accountHolderName: employeeData.accountHolderName || '',

                // Additional Details
                dateOfBirth: employeeData.dateOfBirth || '',
                gender: employeeData.gender || '',
                maritalStatus: employeeData.maritalStatus || '',
                fatherName: employeeData.fatherName || '',
                motherName: employeeData.motherName || '',
                emergencyContactName: employeeData.emergencyContactName || '',
                emergencyContactNumber: employeeData.emergencyContactNumber || '',
                emergencyContactRelation: employeeData.emergencyContactRelation || '',
                
                // Address
                currentAddress: employeeData.currentAddress || '',
                permanentAddress: employeeData.permanentAddress || '',
                city: employeeData.city || '',
                state: employeeData.state || '',
                pincode: employeeData.pincode || '',
                country: employeeData.country || 'India',

                // Employment Details
                joiningDate: employeeData.joiningDate || '',
                department: employeeData.department || '',
                designation: employeeData.designation || '',
                employmentType: employeeData.employmentType || '',
                reportingManager: employeeData.reportingManager || '',
                probationPeriod: employeeData.probationPeriod || '',
                
                // Additional
                bloodGroup: employeeData.bloodGroup || '',
                medicalConditions: employeeData.medicalConditions || '',
                hobbies: employeeData.hobbies || '',

                // System fields
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true
            };

            // Save to Firestore with employee ID as document ID
            const db = getFirestore();
            await db.collection('employees').doc(employeeId).set(employeeRecord);

            res.status(201).json({
                success: true,
                message: 'Employee added successfully',
                data: {
                    employeeId: employeeId,
                    ...employeeRecord
                }
            });

        } catch (error) {
            console.error('Error adding employee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add employee',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get all employees
    async getAllEmployees(req, res) {
        try {
            const db = getFirestore();
            const employeesRef = db.collection('employees');
            
            const snapshot = await employeesRef.get();
            
            if (snapshot.empty) {
                return res.status(200).json({
                    success: true,
                    message: 'No employees found',
                    data: [],
                    count: 0
                });
            }

            const employees = [];
            snapshot.forEach(doc => {
                employees.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            res.status(200).json({
                success: true,
                message: 'Employees retrieved successfully',
                data: employees,
                count: employees.length
            });

        } catch (error) {
            console.error('Error fetching employees:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch employees',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Get employee by ID
    async getEmployeeById(req, res) {
        try {
            const { id } = req.params;
            const db = getFirestore();
            
            const employeeDoc = await db.collection('employees').doc(id).get();
            
            if (!employeeDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Employee retrieved successfully',
                data: {
                    id: employeeDoc.id,
                    ...employeeDoc.data()
                }
            });

        } catch (error) {
            console.error('Error fetching employee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch employee',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Update employee
    async updateEmployee(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const db = getFirestore();
            
            // Add updated timestamp
            updateData.updatedAt = new Date().toISOString();
            
            const employeeRef = db.collection('employees').doc(id);
            const employeeDoc = await employeeRef.get();
            
            if (!employeeDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }
            
            await employeeRef.update(updateData);
            
            res.status(200).json({
                success: true,
                message: 'Employee updated successfully',
                data: {
                    id: id,
                    ...updateData
                }
            });

        } catch (error) {
            console.error('Error updating employee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update employee',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }

    // Delete employee (soft delete)
    async deleteEmployee(req, res) {
        try {
            const { id } = req.params;
            const db = getFirestore();
            
            const employeeRef = db.collection('employees').doc(id);
            const employeeDoc = await employeeRef.get();
            
            if (!employeeDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }
            
            // Soft delete - mark as inactive
            await employeeRef.update({
                isActive: false,
                deletedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            res.status(200).json({
                success: true,
                message: 'Employee deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting employee:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete employee',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}

module.exports = new EmployeeController();