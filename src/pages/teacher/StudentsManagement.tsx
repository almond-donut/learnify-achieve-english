
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Student {
  id: string;
  name: string;
  email: string;
  student_id: string;
  total_points: number;
  level: number;
  last_login: string | null;
  class_id: string | null;
}

const StudentsManagement = () => {
  const { teacherData } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    student_id: '',
    password: ''
  });

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const generateEmail = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '.') + '@gmail.com';
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const email = generateEmail(newStudent.name);
      
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: newStudent.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: newStudent.name,
            role: 'student',
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create student record
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .insert({
            name: newStudent.name,
            email,
            student_id: newStudent.student_id,
          })
          .select()
          .single();

        if (studentError) throw studentError;

        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            role: 'student',
            student_id: studentData.id,
          });

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "Student added successfully",
        });

        setNewStudent({ name: '', student_id: '', password: '' });
        setIsAddDialogOpen(false);
        fetchStudents();
      }
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.includes(searchTerm) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your students and track their progress</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Add New Student</DialogTitle>
              <DialogDescription className="dark:text-gray-300">
                Create a new student account. Email will be auto-generated from the name.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="dark:text-gray-200">Full Name</Label>
                <Input
                  id="name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  placeholder="Enter student's full name"
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {newStudent.name && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Email will be: {generateEmail(newStudent.name)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_id" className="dark:text-gray-200">Student ID (Numbers only)</Label>
                <Input
                  id="student_id"
                  value={newStudent.student_id}
                  onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value.replace(/\D/g, '') })}
                  placeholder="Enter student ID"
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-gray-200">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  placeholder="Enter password"
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Student'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Students List</CardTitle>
          <CardDescription className="dark:text-gray-300">
            Total students: {students.length}
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                <TableHead className="dark:text-gray-300">Name</TableHead>
                <TableHead className="dark:text-gray-300">Student ID</TableHead>
                <TableHead className="dark:text-gray-300">Email</TableHead>
                <TableHead className="dark:text-gray-300">Level</TableHead>
                <TableHead className="dark:text-gray-300">Points</TableHead>
                <TableHead className="dark:text-gray-300">Last Active</TableHead>
                <TableHead className="dark:text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="dark:border-gray-700">
                  <TableCell className="font-medium dark:text-white">{student.name}</TableCell>
                  <TableCell className="dark:text-gray-300">{student.student_id}</TableCell>
                  <TableCell className="dark:text-gray-300">{student.email}</TableCell>
                  <TableCell className="dark:text-gray-300">
                    <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                      Level {student.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="dark:text-gray-300">{student.total_points}</TableCell>
                  <TableCell className="dark:text-gray-300">
                    {student.last_login ? new Date(student.last_login).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentsManagement;
