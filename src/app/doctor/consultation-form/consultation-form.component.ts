import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm } from '@angular/forms';
import { DoctorService } from 'src/app/_services/doctor.service';
import { ConsultationCard } from 'src/app/interfaces/ConsultationCard';
import { DateShareService } from 'src/app/_services/date-share.service';
import { DoctorAuthService } from 'src/app/_services/doctor-auth.service';
import { formatDate } from '@angular/common';
import { ConsultationService } from 'src/app/_services/consultation.service';
import { Patient } from 'src/app/interfaces/Patient';
import { Router } from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-consultation-form',
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.css']
})
export class ConsultationFormComponent implements OnInit {
  optionValue: string = 'Follow-up';
  doctorRoles: any = [];
  doctors: any = [];
  consultationForm: FormGroup;
  reports: ConsultationCard[] = [];
  patient: Patient;
  name: string = '';
  consultation: ConsultationCard = {} as ConsultationCard;

  constructor(private doctorService: DoctorService,
              private fb:FormBuilder,
              private dataShareService: DateShareService,
              private doctorAuthService: DoctorAuthService,
              private consultationService: ConsultationService,
              private router: Router,
              private _snackBar: MatSnackBar) { }

  async ngOnInit() {
    this.reports = this.dataShareService.getReports();
    this.patient = this.dataShareService.getPatient();

    this.name = this.patient.first_name +" "+ this.patient.last_name;

    this.consultationForm = this.fb.group({
        name: this.name,
        date: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
        diagnosisType: [''],
        compliant: [''],
        examination: [''],
        icd10Code: [''],
        icdDescription: [''],
        instructions: [''],
        improvementType: [''],
        illnessSummary: [''],
        medicines: this.fb.array([]),
        remarks: [''],
        furtherInstructions: [''],
        followUp: [''],
        doctorRole: [''],
        doctorName: [''],
      });

    this.doctorService.getDoctorDetails(this.doctorAuthService.getId()).subscribe({
      next: (doctor: any) => {
        let currentRole = doctor.doctor.role.roleName;
        this.doctorService.getDoctorRoles().subscribe({
          next: (response: any) => {
            response.forEach((r: any) => {
              if(r.roleName!=='admin' && r.roleName!=='program manager'){
                if(currentRole==='secondary specialist'){
                  if(r.roleName!=='medical officer') this.doctorRoles.push(r);
                }
                else if(currentRole==='tertiary specialist'){
                  if(r.roleName==='tertiary specialist') this.doctorRoles.push(r);
                }
                else this.doctorRoles.push(r);
              }
            });
          },
          error: (error: any) => {
            console.log(error);
          }
        }) 
      },
      error: (error: any) => {
        console.log(error);
      }
    })
  }

  async create(){
    this.consultation.patient = this.patient;
    this.doctorService.getDoctorDetails(this.doctorAuthService.getId()).subscribe({
      next: (response: any) => {
        // this.consultation.hospital = response.hospital;
        this.consultation.doctor = response;
        this.consultation.hospital = this.consultation.doctor.hospital;
        this.consultation.compliant = this.consultationForm.value.compliant;
        this.consultation.examination = this.consultationForm.value.examination;
        this.consultation.illnessSummary = this.consultationForm.value.illnessSummary;
        this.consultation.diagnosistype = this.consultationForm.value.diagnosisType;
        this.consultation.icdDescription = this.consultationForm.value.icdDescription;
        this.consultation.icd10Code = this.consultationForm.value.icd10Code;
        this.consultation.improvementtype = this.consultationForm.value.improvementType;
        this.consultation.medicineInfo = this.consultationForm.value.medicines;
        this.consultation.dateAndTime = this.consultationForm.value.date;
        this.consultation.remarks = this.consultationForm.value.remarks;
        this.consultation.treatmentInstructions = this.consultationForm.value.instructions;
        this.consultation.followUp = this.consultationForm.value.followUp;
        this.consultation.questionnaireResponse = this.dataShareService.getQuestionnaireResponse();

        
        if(this.consultationForm.value.doctorName.length>0){
          this.doctorService.getDoctorDetails(this.consultationForm.value.doctorName).subscribe({
            next: (response: any) => {
              this.consultation.refer = response;
              console.log(this.consultation);

              this.consultationService.createConsultationForm(this.consultation).subscribe({
                next: (response: any) => {
                  console.log(response);
                  this._snackBar.open("Success! Redirecting to home page in 5 seconds", '', {duration: 5000});
                  setTimeout(() => {
                    this.router.navigate(['doctor/search-patient']);
                  }, 3000);
                },
                error: (error: any) => {
                  console.log(error);
                  this._snackBar.open("Error! Try filling the form again", '', {duration: 3000});
                }
              })
            },
            error: (error: any) => {
              console.log(error);
            }
          });
        }
        else{
          console.log(this.consultation);
          this.consultationService.createConsultationForm(this.consultation).subscribe({
            next: (response: any) => {
              console.log(response);
              this._snackBar.open("Success! Redirecting to home page in 5 seconds", '', {duration: 5000});
              setTimeout(() => {
                this.router.navigate(['doctor/search-patient']);
              }, 3000);
            },
            error: (error: any) => {
              console.log(error);
              this._snackBar.open("Error! Try filling the form again", '', {duration: 3000});
            }
          })
        }
      },
      error: (error: any) => {
        console.log(error);
      }
    });
  }

  onChange(event: any){
    this.optionValue = event.target.value;
  }

  onRoleChange(event: any){
    this.doctors = [];
    this.doctorService.getDoctorByRoleId(event.target.value).subscribe({
      next: (response: any) => {
        response.forEach((r:any) => {
          if(r.doctor.userId!=this.doctorAuthService.getId()) this.doctors.push(r);
        });
      },
      error: (error: any) => {
        console.log(error);
      }
    })
  }

  medicines(): FormArray{
    return this.consultationForm.get("medicines") as FormArray;
  }

  newMedicine(): FormGroup{
    return this.fb.group({
      medicineName: [''],
      dosage: [''],
      remarks: [''],
      duration: ['']
    });
  }

  addMedicine(){
    this.medicines().push(this.newMedicine());
  }

  removeMedicine(i: number){
    this.medicines().removeAt(i);
  }

  formatDate(date: Date): string {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;

    return [year, month, day].join('-');
  }


}
