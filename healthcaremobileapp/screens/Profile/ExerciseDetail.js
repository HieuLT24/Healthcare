import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";

const ExerciseDetail = () => {
    const route = useRoute();
    const { exerciseId } = route.params;
    const [exercise, setExercise] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExercise = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const res = await Apis.get(endpoints["exercise-detail"](exerciseId), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setExercise(res.data);
            } catch (error) {
                setExercise(null);
            } finally {
                setLoading(false);
            }
        };
        fetchExercise();
    }, [exerciseId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3EB489" />
            </View>
        );
    }

    if (!exercise) {
        return (
            <View style={styles.center}>
                <Text>Không tìm thấy bài tập.</Text>
            </View>
        );
    }

    // Nếu muscle_groups là mảng object, lấy tên; nếu là mảng string, giữ nguyên
    let muscleGroupsDisplay = "";
    if (exercise.muscle_groups && exercise.muscle_groups.length > 0) {
        if (typeof exercise.muscle_groups[0] === "object" && exercise.muscle_groups[0].name) {
            muscleGroupsDisplay = exercise.muscle_groups.map(mg => mg.name).join(", ");
        } else {
            muscleGroupsDisplay = exercise.muscle_groups.join(", ");
        }
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
            <View style={styles.card}>
                <Text style={styles.title}>{exercise.name}</Text>
                <View style={styles.line}>
                    <Text style={styles.label}>📝 Mô tả: </Text>
                    <Text style={styles.value}>{exercise.description || "Không có mô tả"}</Text>
                </View>
                <View style={styles.line}>
                    <Text style={styles.label}>💪 Độ khó: </Text>
                    <Text style={styles.value}>{exercise.difficulty_level}</Text>
                </View>
                {exercise.equipment && (
                    <View style={styles.line}>
                        <Text style={styles.label}>🛠 Dụng cụ: </Text>
                        <Text style={styles.value}>{exercise.equipment}</Text>
                    </View>
                )}
                {exercise.duration && (
                    <View style={styles.line}>
                        <Text style={styles.label}>⏱ Thời lượng: </Text>
                        <Text style={styles.value}>{exercise.duration} phút</Text>
                    </View>
                )}
                {typeof exercise.calories_burned !== "undefined" && exercise.calories_burned !== null && (
                    <View style={styles.line}>
                        <Text style={styles.label}>🔥 Lượng calo tiêu thụ: </Text>
                        <Text style={styles.value}>{exercise.calories_burned} kcal</Text>
                    </View>
                )}
                {muscleGroupsDisplay && (
                    <View style={styles.line}>
                        <Text style={styles.label}>🏷 Nhóm cơ: </Text>
                        <Text style={styles.value}>{muscleGroupsDisplay}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#EFFFF7",
        borderRadius: 16,
        padding: 20,
        margin: 16,
        marginBottom: 12,
        shadowColor: "#B0BEC5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.11,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#3EB489"
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#3EB489",
        marginBottom: 6,
        textAlign: "left"
    },
    line: { flexDirection: "row", alignItems: "flex-start", marginVertical: 4, flexWrap: "wrap" },
    label: { color: "#212121", fontWeight: "bold" },
    value: { color: "#3EB489", fontWeight: "500", flexShrink: 1 },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});

export default ExerciseDetail;