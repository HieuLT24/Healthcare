import { StyleSheet } from "react-native";

const MyStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 16
    },
    statItem: {
        marginBottom: 12,
        padding: 12,
        backgroundColor: "#f2f2f2",
        borderRadius: 8
    },
    label: {
        fontSize: 16,
        color: "#555",
        marginBottom: 4
    },
    value: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16
    },
    errorText: {
        color: "red",
        fontSize: 16,
        textAlign: "center"
    },
    m: {
        margin: 8
    },
    p: {
        padding: 8
    },
    avatar: {
        width: 150,
        height: 150,
        borderRadius: 75
    },
    subject: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        margin: 16
    },
    bg: {
        backgroundColor: "#a7f3d0"
    }
});

export default MyStyles;