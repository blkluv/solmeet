"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, DollarSign, Mail, User, UserPen } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useEffect, useState } from "react"
import { DropdownMenuTrigger, DropdownMenu, DropdownMenuItem, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import TimeSelector from "@/components/calender/time"
import axios from "axios"
import { toast } from "sonner";
import { UserInfo, WeekDay, ExpertProfile } from "@/types/frontend-types"
import { convertToUTC } from "@/lib/timeToUTC"
import  TagInput  from "@/components/ui/tag-input"

const mockTags = ["Solana Expert", "Web3 Expert", "DevRel", "Blockchain Developer", "Smart Contract Developer"];

export default function ProfilePage() {
  const [editing, setEditing] = useState(false)
  const [availableWeekDays, setAvailableWeekDays] = useState<WeekDay[]>([])
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [startTimeSlot, setStartTimeSlot] = useState({ hour: "08", minute: "00", period: "PM" });
  const [endTimeSlot, setEndTimeSlot] = useState({ hour: "10", minute: "30", period: "PM" });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null)
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const response = await axios.get<UserInfo>("/api/profile");
        setUserInfo(response.data)
        setExpertProfile(response.data.expertProfile)

        if (response.data.expertProfile.startTimeSlot && response.data.expertProfile.endTimeSlot) {
          const convertToLocalTime = (utcDateTime: Date) => {
            const localTime = new Date(utcDateTime)
              .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
              .split(" ");

            const [hourMinute, period] = localTime;
            const [hour, minute] = hourMinute.split(":");

            return { hour, minute, period };
          };

          if(response.data.expertProfile.availableWeekDays) {
            setAvailableWeekDays(response.data.expertProfile.availableWeekDays);
          }
          // Convert UTC to Local
          const startTimeLocal = convertToLocalTime(new Date(response.data.expertProfile.startTimeSlot));
          const endTimeLocal = convertToLocalTime(new Date(response.data.expertProfile.endTimeSlot));

          setStartTimeSlot(startTimeLocal);
          setEndTimeSlot(endTimeLocal);
        }

        if (response.data.expertProfile.tags) {
          setTags(response.data.expertProfile.tags);
        }
      } catch (error: any) {
        console.error("Error fetching profile data:", error)
        toast.error("Error fetching profile data:", error)
      }
    }

    fetchProfileData()
  }, [])

  const handleSave = async () => {
    toast.promise(
      new Promise<string>(async (resolve, reject) => {
        try {
          const startTime = convertToUTC(startTimeSlot);
          const endTime = convertToUTC(endTimeSlot);

          if (startTime && endTime) {
            const updatedExpertProfile = {
              ...expertProfile!,
              startTimeSlot: startTime,
              endTimeSlot: endTime,
              availableWeekDays: availableWeekDays,
              tags: tags,
            };
            setExpertProfile(updatedExpertProfile);
            setSelectedTimeSlots([startTime.toLocaleString().split(",")[1].trim(), endTime.toLocaleString().split(",")[1].trim()]);

            const updatedUserInfo = {
              ...userInfo!,
              expertProfile: updatedExpertProfile,
            };
            setUserInfo(updatedUserInfo);

            await axios.post("/api/profile", { data: updatedUserInfo });
          }
          setEditing(false);
          resolve("Profile saved successfully! 🎉");
        } catch (error) {
          console.error("Error saving profile data:", error);
          reject(new Error("Error saving profile data. Please try again."));
        }
      }),
      {
        loading: "Saving profile...",
        success: (message) => message,
        error: (error) => error.message,
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-black text-white">
        <main className="container mx-auto px-4 py-12">
          <Card className="bg-black/40 backdrop-blur-sm border border-purple-500/20">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            {userInfo ?
              <CardContent>
                {userInfo ? (
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Basic Information</h2>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-4 mt-4">
                      {editing ?
                        <div className="flex items-center">
                          <User className="h-5 w-5 mr-2 text-purple-400" />
                          <input
                            type="text"
                            value={userInfo.name || ""}
                            onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value } as UserInfo)}
                            className="form-input text-black bg-white rounded"
                          />
                        </div>
                        :
                        <div className="flex items-center">
                          <User className="h-5 w-5 mr-2 text-purple-400" />
                          <span>{userInfo.name}</span>
                        </div>}
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-2 text-purple-400" />
                        <span>{userInfo.email}</span>
                      </div>
                      <div className="flex items-center">
                        <UserPen className="h-5 w-5 mr-2 text-purple-400" />
                        <span>{userInfo.username}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                        <span>Member since {new Date(userInfo.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Wallet Information</h2>
                      </div>
                      <div className="mt-4">
                        {editing ? (
                          <input
                            type="text"
                            value={userInfo.walletAddress || ""}
                            onChange={(e) => setUserInfo({ ...userInfo, walletAddress: e.target.value } as UserInfo)}
                            className="form-input text-black bg-white w-full rounded"
                          />
                        ) : (
                          <p className="break-all">{userInfo.walletAddress ? userInfo.walletAddress : "Not Set Yet"}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Hourly Rate</h2>
                      </div>
                      <div className="mt-4">
                        {editing ? (
                          <div className="flex items-center">
                            <input
                              type="number"
                              step="0.01"
                              value={expertProfile?.hourlyRate || ""}
                              onChange={(e) => setExpertProfile({ ...expertProfile, hourlyRate: Number(e.target.value) } as ExpertProfile)}
                              className="form-input text-black bg-white rounded"
                            />
                            <p className="ml-2">SOL</p>
                          </div>
                        ) : (
                          <p className="break-all">{expertProfile?.hourlyRate ? `${expertProfile.hourlyRate} SOL/hr` : "Not Set Yet"}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Availability</h2>
                      </div>
                      <div className="mt-4 space-y-4">
                        {editing ? (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-300">Select Days</label>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button className="w-half text-left">{availableWeekDays.length > 0 ? availableWeekDays.join(", ") : "Select Days"}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white text-black rounded shadow-lg p-2" side="bottom" align="start">
                                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                                  <DropdownMenuItem key={day} asChild>
                                    <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      value={day}
                                      checked={availableWeekDays.includes(day as WeekDay)}
                                      onChange={(e) => {
                                      const selectedDay = day as WeekDay;
                                      if (e.target.checked) {
                                        setAvailableWeekDays([...availableWeekDays, selectedDay])
                                      } else {
                                        setAvailableWeekDays(availableWeekDays.filter((d) => d !== selectedDay))
                                      }
                                      }}
                                      className="form-checkbox text-purple-500"
                                    />
                                    <span>{day}</span>
                                    </label>
                                  </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex gap-5">
                              <TimeSelector label="From" time={startTimeSlot} setTime={setStartTimeSlot} />
                              <TimeSelector label="To" time={endTimeSlot} setTime={setEndTimeSlot} />
                            </div>
                          </>
                        ) : (
                          <div>
                            <p className="text-l text-gray-300">Selected Days: {availableWeekDays.join(", ")}</p>
                            <p className="text-l text-gray-300">Selected Time Slots: {selectedTimeSlots.join(" - ")}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Tags</h2>
                      </div>
                      <div className="mt-4">
                        {editing ? (
                          <TagInput
                            tags={tags}
                            setTags={setTags}
                            suggestions={mockTags}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag, index) => (
                              <span key={index} className="bg-purple-500 text-white px-2 py-1 rounded">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          if (editing) {
                            handleSave()
                          } else {
                            setEditing(true)
                          }
                        }}
                        className="ml-auto w-20 px-2 py-1 text-sm"
                      >
                        {editing ? "Save" : "Edit"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  </div>
                )}
              </CardContent>
              :
              <div className="flex justify-center items-center h-full">
                <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </div>
            }
          </Card>
        </main>
      </div>
    </DashboardLayout>
  )
}
